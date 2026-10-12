"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  FiAtSign,
  FiCheck,
  FiEdit2,
  FiMaximize2,
  FiMessageCircle,
  FiMinimize2,
  FiSend,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { confirmDanger, showError } from "@/libs/swal";
import { getDisplayImageUrl } from "@/libs/api/imageUrl";

type Message = {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
    classPosition: string;
  };
};

type ChatEvent =
  | { type: "CHAT_CREATED"; message: Message }
  | { type: "CHAT_UPDATED"; message: Message }
  | { type: "PROFILE_UPDATED"; userId: string; image: string | null }
  | { type: "CHAT_DELETED"; messageId: string };

type MentionUser = {
  id: string;
  name: string;
  nim: string;
  image: string | null;
};

function playMessageSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.34);
    gain.connect(context.destination);
    [0, 0.11].forEach((offset, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        index === 0 ? 659.25 : 880,
        context.currentTime + offset,
      );
      oscillator.connect(gain);
      oscillator.start(context.currentTime + offset);
      oscillator.stop(context.currentTime + offset + 0.16);
    });
    window.setTimeout(() => void context.close(), 450);
  } catch {
    // Audio menunggu interaksi pengguna pada iOS.
  }
}

function ChatAvatar({ message }: { message: Message }) {
  const initials = message.user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-600 text-[10px] font-black text-white [clip-path:circle(50%)]">
      {message.user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getDisplayImageUrl(message.user.image)}
          alt={message.user.name}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ChatMessageText({
  text,
  mentionUsers,
}: {
  text: string;
  mentionUsers: MentionUser[];
}) {
  const labels = ["@all", ...mentionUsers.map((user) => `@${user.name}`)].sort(
    (left, right) => right.length - left.length,
  );
  const matcher = new RegExp(`(${labels.map(escapeRegExp).join("|")})`, "gi");
  return (
    <p className="whitespace-pre-wrap break-words pr-10 text-[13px] leading-5">
      {text.split(matcher).map((part, index) =>
        part.startsWith("@") ? (
          <span key={`${part}-${index}`} className="font-black text-blue-600">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </p>
  );
}

function getActiveMention(value: string, cursor: number) {
  const match = value.slice(0, cursor).match(/(^|\s)@([^\s@]*)$/);
  return match
    ? { start: cursor - match[2].length - 1, query: match[2].toLowerCase() }
    : null;
}

export default function GlobalChat() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [unread, setUnread] = useState(0);
  const [canModerate, setCanModerate] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editingText, setEditingText] = useState("");
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [selectedMentions, setSelectedMentions] = useState<MentionUser[]>([]);
  const [mentionAll, setMentionAll] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const openChat = () => setOpen(true);
    const timer = window.setTimeout(() => {
      try {
        const params = new URL(window.location.href).searchParams;
        if (params.get("chat") === "open") setOpen(true);
      } catch {
        // URL tidak valid tidak mengganggu global chat.
      }
    }, 0);
    window.addEventListener("markasti:open-chat", openChat);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("markasti:open-chat", openChat);
    };
  }, []);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // The SSE bridge gives immediate updates on a shared app process. Reconcile
  // while the chat is visible too, since Vercel may serve SSE and mutations
  // from different function instances.
  useEffect(() => {
    if (!open) return;
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/chat", { cache: "no-store" });
        const result = (await response.json()) as {
          ok?: boolean;
          data?: Message[];
          canModerate?: boolean;
          mentionUsers?: MentionUser[];
        };
        if (!active || !result.ok) return;
        if (Array.isArray(result.data)) setMessages(result.data);
        if (Array.isArray(result.mentionUsers)) setMentionUsers(result.mentionUsers);
        setCanModerate(Boolean(result.canModerate));
      } catch {
        // Keep the last known chat state while temporarily offline.
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [open]);

  useEffect(() => {
    fetch("/api/chat", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (result.ok) {
          setMessages(result.data);
          setCanModerate(Boolean(result.canModerate));
          setMentionUsers(
            Array.isArray(result.mentionUsers) ? result.mentionUsers : [],
          );
        }
      })
      .catch(() => undefined);

    const source = new EventSource("/api/realtime/chat");
    source.addEventListener("chat", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as ChatEvent;

      if (payload.type === "CHAT_DELETED") {
        setMessages((current) =>
          current.filter((message) => message.id !== payload.messageId),
        );
        return;
      }

      if (payload.type === "CHAT_UPDATED") {
        setMessages((current) =>
          current.map((message) =>
            message.id === payload.message.id ? payload.message : message,
          ),
        );
        return;
      }

      if (payload.type === "PROFILE_UPDATED") {
        setMessages((current) =>
          current.map((message) =>
            message.user.id === payload.userId
              ? { ...message, user: { ...message.user, image: payload.image } }
              : message,
          ),
        );
        setMentionUsers((current) =>
          current.map((user) =>
            user.id === payload.userId ? { ...user, image: payload.image } : user,
          ),
        );
        return;
      }

      const message = payload.message;
      setMessages((current) =>
        current.some((item) => item.id === message.id)
          ? current
          : [...current.slice(-99), message],
      );

      if (message.user.id !== session?.user?.id) {
        playMessageSound();
        if (!openRef.current) setUnread((current) => current + 1);
      }
    });

    return () => source.close();
  }, [session?.user?.id]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText("");
    const selectedIds = selectedMentions.map((user) => user.id);
    const selectedAll = mentionAll;

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: value,
        mentionedUserIds: selectedIds,
        mentionAll: selectedAll,
      }),
    });
    if (!response.ok) {
      setText(value);
    } else {
      setSelectedMentions([]);
      setMentionAll(false);
    }
  }

  const activeMention = getActiveMention(text, cursor);
  const mentionSuggestions = useMemo(() => {
    if (!activeMention) return [];
    const people = mentionUsers.filter(
      (user) =>
        !activeMention.query ||
        user.name.toLowerCase().includes(activeMention.query) ||
        user.nim.toLowerCase().includes(activeMention.query),
    );
    return people.slice(0, 8);
  }, [activeMention, mentionUsers]);

  function insertMention(user: MentionUser) {
    if (!activeMention) return;
    const token = user.id === "__all" ? "@all" : `@${user.name}`;
    const nextText = `${text.slice(0, activeMention.start)}${token} ${text.slice(cursor)}`;
    const nextCursor = activeMention.start + token.length + 1;
    setText(nextText);
    setCursor(nextCursor);
    setActiveSuggestion(0);
    if (user.id === "__all") setMentionAll(true);
    else
      setSelectedMentions((current) =>
        current.some((item) => item.id === user.id)
          ? current
          : [...current, user],
      );
    window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(nextCursor, nextCursor);
    }, 0);
  }

  function updateText(value: string, nextCursor: number) {
    setText(value);
    setCursor(nextCursor);
    setActiveSuggestion(0);
    setMentionAll(/(^|\s)@all(?=\s|$)/i.test(value));
    setSelectedMentions((current) =>
      current.filter((user) => value.includes(`@${user.name}`)),
    );
  }

  function openMentionSuggestions() {
    const element = inputRef.current;
    if (!element) return;
    const position = element.selectionStart ?? text.length;
    const insertion = `${position > 0 && !/\s/.test(text[position - 1]) ? " " : ""}@`;
    const nextText = `${text.slice(0, position)}${insertion}${text.slice(position)}`;
    const nextCursor = position + insertion.length;
    updateText(nextText, nextCursor);
    window.setTimeout(() => {
      element.focus();
      element.setSelectionRange(nextCursor, nextCursor);
    }, 0);
  }

  async function saveEdit() {
    const value = editingText.trim();
    if (!editingId || !value) return;

    const response = await fetch("/api/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, text: value }),
    });
    if (response.ok) {
      setEditingId("");
      setEditingText("");
    }
  }

  async function deleteMessage(message: Message) {
    if (
      !(await confirmDanger(
        "Hapus pesan?",
        `Pesan dari ${message.user.name} akan dihapus permanen.`,
      ))
    )
      return;
    const response = await fetch(
      `/api/chat?id=${encodeURIComponent(message.id)}`,
      {
        method: "DELETE",
      },
    );
    if (!response.ok) await showError("Pesan gagal dihapus");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setUnread(0);
          setOpen(true);
        }}
        className="fixed bottom-5 right-5 z-[120] grid h-14 w-14 place-items-center rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-900/30 transition hover:-translate-y-1"
        aria-label="Buka global chat"
      >
        <FiMessageCircle className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black ring-2 ring-white">
            {Math.min(unread, 99)}
          </span>
        )}
      </button>
    );
  }

  return (
    <section
      className={`globalChat-panel fixed z-[120] overflow-hidden border border-blue-100 bg-white shadow-2xl shadow-slate-950/30 ${
        maximized
          ? "inset-3 rounded-4xl md:inset-8"
          : "chat-compact bottom-5 right-5 h-[min(38rem,82dvh)] w-[min(25rem,calc(100vw-2rem))] rounded-4xl"
      }`}
    >
      <header className="flex items-center justify-between bg-blue-600 px-5 py-4 text-white">
        <div>
          <p className="font-black">Global Chat</p>
          {/* <p className="text-[11px] text-blue-100">
            Tamu dapat membaca · akun dapat mengirim
          </p> */}  
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={maximized ? "Kecilkan chat" : "Perbesar chat"}
            onClick={() => setMaximized((value) => !value)}
            className="rounded-xl bg-white/15 p-2"
          >
            {maximized ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>
          <button
            type="button"
            aria-label="Tutup chat"
            onClick={() => setOpen(false)}
            className="rounded-xl bg-white/15 p-2"
          >
            <FiX />
          </button>
        </div>
      </header>

      <div className="chat-wallpaper h-[calc(100%-8.5rem)] overflow-y-auto p-3">
        <div className="chat-sticker-layer" aria-hidden="true">
          <span className="chat-sticker">🚀</span>
          <span className="chat-sticker">💻</span>
          <span className="chat-sticker">🐱</span>
          <span className="chat-sticker">✨</span>
          <span className="chat-sticker">☕</span>
          <span className="chat-sticker">🎧</span>
          <span className="chat-sticker">📚</span>
          <span className="chat-sticker">🤖</span>
        </div>

        <div className="relative z-10 space-y-2">
          {messages.map((message) => {
          const own = message.user.id === session?.user?.id;
          const canDelete = own || canModerate;
          const isEdited = message.updatedAt !== message.createdAt;

          return (
            <div
              key={message.id}
              className={`group flex items-end gap-2 ${own ? "justify-end" : "justify-start"}`}
            >
              {!own && <ChatAvatar message={message} />}
              <div
                className={`relative max-w-[78%] px-3 py-2 shadow-sm ${
                  own
                    ? "chat-bubble-own rounded-[1rem] rounded-br-md text-slate-800"
                    : "chat-bubble-other rounded-[1rem] rounded-bl-md text-slate-800"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p
                    className={`text-[11px] font-black ${
                      own ? "text-emerald-700" : "text-blue-600"
                    }`}
                  >
                    {message.user.name}
                  </p>
                  {status === "authenticated" && (own || canDelete) && (
                    <div className="flex gap-1 opacity-60 transition group-hover:opacity-100">
                      {own && (
                        <button
                          type="button"
                          aria-label="Edit pesan"
                          onClick={() => {
                            setEditingId(message.id);
                            setEditingText(message.text);
                          }}
                          className="rounded-lg p-1 hover:bg-black/10"
                        >
                          <FiEdit2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          aria-label="Hapus pesan"
                          onClick={() => void deleteMessage(message)}
                          className="rounded-lg p-1 hover:bg-rose-500 hover:text-white"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {editingId === message.id ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={editingText}
                      onChange={(event) => setEditingText(event.target.value)}
                      className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-2 ring-blue-200"
                    />
                    <button
                      type="button"
                      aria-label="Simpan edit pesan"
                      onClick={() => void saveEdit()}
                      className="rounded-xl bg-emerald-500 p-2 text-white"
                    >
                      <FiCheck />
                    </button>
                    <button
                      type="button"
                      aria-label="Batal edit pesan"
                      onClick={() => setEditingId("")}
                      className="rounded-xl bg-slate-500 p-2 text-white"
                    >
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <ChatMessageText
                    text={message.text}
                    mentionUsers={mentionUsers}
                  />
                )}

                <p className="mt-0.5 text-right text-[9px] text-slate-400">
                  {new Date(message.createdAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {isEdited ? " · diedit" : ""}
                </p>
              </div>
              {own && <ChatAvatar message={message} />}
            </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {status === "authenticated" ? (
        <form
          onSubmit={send}
          className="relative flex min-h-17 gap-2 border-t border-blue-100 bg-white p-3"
        >
          {activeMention && (
            <div className="absolute bottom-full left-2 right-2 mb-2 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl shadow-slate-950/20">
              <div className="border-b border-slate-100 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black text-slate-800">
                    Tag anggota
                  </p>
                  <button
                    type="button"
                    onClick={() => setCursor(-1)}
                    aria-label="Tutup pilihan tag"
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                  >
                    <FiX />
                  </button>
                </div>
                <p className="mt-2 text-[10px] font-semibold text-slate-400">
                  Ketik nama setelah tanda @
                </p>
              </div>
              <div className="max-h-56 overflow-y-auto p-2">
                {"all".includes(activeMention.query) && (
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() =>
                      insertMention({
                        id: "__all",
                        name: "Semua orang",
                        nim: "Tag seluruh anggota",
                        image: null,
                      })
                    }
                    className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-black transition ${activeSuggestion === 0 ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
                  >
                    <span>@all · Tag semua orang</span>
                    {mentionAll && <FiCheck />}
                  </button>
                )}
                {mentionSuggestions.map((user, index) => {
                  const selected =
                    index + ("all".includes(activeMention.query) ? 1 : 0) ===
                    activeSuggestion;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => insertMention(user)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${selected ? "bg-cyan-50 text-cyan-800" : "hover:bg-slate-50"}`}
                    >
                      {user.image ? (
                        <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getDisplayImageUrl(user.image)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </span>
                      ) : (
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-black text-blue-700">
                          {user.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-black">
                          {user.name}
                        </span>
                        <span className="block text-[10px] font-semibold text-slate-400">
                          {user.nim}
                        </span>
                      </span>
                      {selected && <FiCheck className="text-cyan-600" />}
                    </button>
                  );
                })}
                {mentionSuggestions.length === 0 && (
                  <p className="px-3 py-6 text-center text-xs font-semibold text-slate-400">
                    User tidak ditemukan.
                  </p>
                )}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={openMentionSuggestions}
            aria-label="Tag user"
            className={`relative grid w-11 shrink-0 place-items-center rounded-2xl border font-black transition ${mentionAll || selectedMentions.length > 0 ? "border-blue-600 bg-blue-600 text-white" : "border-blue-100 bg-blue-50 text-blue-700"}`}
          >
            <FiAtSign />
            {(mentionAll || selectedMentions.length > 0) && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[9px] text-white ring-2 ring-white">
                {mentionAll ? "ALL" : selectedMentions.length}
              </span>
            )}
          </button>
          <input
            ref={inputRef}
            value={text}
            onChange={(event) =>
              updateText(
                event.target.value,
                event.target.selectionStart ?? event.target.value.length,
              )
            }
            onClick={(event) =>
              setCursor(event.currentTarget.selectionStart ?? text.length)
            }
            onKeyUp={(event) => {
              if (
                !["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(event.key)
              )
                setCursor(event.currentTarget.selectionStart ?? text.length);
            }}
            onKeyDown={(event) => {
              if (!activeMention) return;
              const options = [
                ...("all".includes(activeMention.query)
                  ? [
                      {
                        id: "__all",
                        name: "Semua orang",
                        nim: "Tag seluruh anggota",
                        image: null,
                      },
                    ]
                  : []),
                ...mentionSuggestions,
              ];
              if (options.length === 0) return;
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveSuggestion(
                  (current) => (current + 1) % options.length,
                );
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveSuggestion(
                  (current) => (current - 1 + options.length) % options.length,
                );
              } else if (event.key === "Enter") {
                event.preventDefault();
                insertMention(options[activeSuggestion] || options[0]);
              } else if (event.key === "Escape") setCursor(-1);
            }}
            maxLength={1000}
            placeholder="Tulis pesan..."
            className="min-w-0 flex-1 rounded-2xl bg-blue-50 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            aria-label="Kirim pesan"
            className="grid w-12 place-items-center rounded-2xl bg-blue-600 text-white"
          >
            <FiSend />
          </button>
        </form>
      ) : (
        <div className="flex h-17 items-center justify-center border-t border-blue-100 p-3 text-sm">
          <Link href="/login" className="font-black text-blue-600">
            Login untuk ikut chat
          </Link>
        </div>
      )}
    </section>
  );
}
