import type { MetadataRoute } from "next";
import { withBasePath } from "./site-path";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AstroShot — Real Sky & Meteor Simulator",
    short_name: "AstroShot",
    description: "Plan and simulate a night-sky observation, even when the network is unavailable.",
    start_url: withBasePath("/"),
    scope: withBasePath("/"),
    display: "standalone",
    background_color: "#03070b",
    theme_color: "#07121b",
    orientation: "any",
    icons: [
      { src: withBasePath("/icon-512.png"), sizes: "512x512", type: "image/png" },
      { src: withBasePath("/icon-1024.png"), sizes: "1024x1024", type: "image/png" },
    ],
  };
}
