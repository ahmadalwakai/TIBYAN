import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Favicon as a Next.js generated image
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: "linear-gradient(135deg, #0B1F3A 0%, #1a365d 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
        }}
      >
        <span
          style={{
            color: "#00FF2A",
            fontWeight: "bold",
            fontFamily: "system-ui",
          }}
        >
          ت
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
