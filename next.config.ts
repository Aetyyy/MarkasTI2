module.exports = {
  allowedDevOrigins: ["local-origin.dev", "*.local-origin.dev"],
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
      },
    ],
  },
};
