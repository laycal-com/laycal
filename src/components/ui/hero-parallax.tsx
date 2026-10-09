"use client";
import React from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

export type ParallaxTile = {
  title: string;
  content: React.ReactNode;
};

/**
 * Aceternity Hero Parallax, adapted in two ways: tiles are live DOM rather
 * than thumbnails (so they stay sharp and need no image pipeline), and the
 * header is passed in instead of hard-coded.
 */
export const HeroParallax = ({
  tiles,
  header,
  className,
}: {
  tiles: ParallaxTile[];
  header: React.ReactNode;
  className?: string;
}) => {
  const firstRow = tiles.slice(0, 5);
  const secondRow = tiles.slice(5, 10);
  const thirdRow = tiles.slice(10, 15);
  const ref = React.useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30 };

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-700, 500]),
    springConfig
  );

  // Reduced motion gets the settled end state as a plain, static layout.
  if (reduce) {
    return (
      <div ref={ref} className={cn("relative overflow-hidden pb-24 antialiased", className)}>
        <div className="relative z-10">{header}</div>
        <div aria-hidden="true" className="flex flex-col gap-10 md:gap-20">
          {[firstRow, secondRow, thirdRow].map((row, i) => (
            <div
              key={i}
              className={cn("flex gap-10 md:gap-20", i % 2 === 0 ? "flex-row-reverse" : "flex-row")}
            >
              {row.map((tile) => (
                <TileCard tile={tile} key={tile.title} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        // Height follows the content rather than a fixed 300vh, which left an
        // empty band under the tiles on tall displays. The bottom padding makes
        // room for the 500px the tile block travels downward.
        "relative flex flex-col self-auto overflow-hidden pb-[36rem] pt-40 antialiased [perspective:1000px]",
        className
      )}
    >
      {/* Above the tiles, so the dimmed intro pose never sits on the copy or
          swallows clicks meant for the buttons. */}
      <div className="relative z-10">{header}</div>
      <motion.div
        aria-hidden="true"
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
      >
        <motion.div className="mb-10 flex flex-row-reverse space-x-10 space-x-reverse md:mb-20 md:space-x-20">
          {firstRow.map((tile) => (
            <TileCard tile={tile} translate={translateX} key={tile.title} />
          ))}
        </motion.div>
        <motion.div className="mb-10 flex flex-row space-x-10 md:mb-20 md:space-x-20">
          {secondRow.map((tile) => (
            <TileCard tile={tile} translate={translateXReverse} key={tile.title} />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-10 space-x-reverse md:space-x-20">
          {thirdRow.map((tile) => (
            <TileCard tile={tile} translate={translateX} key={tile.title} />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const TileCard = ({
  tile,
  translate,
}: {
  tile: ParallaxTile;
  translate?: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={translate ? { x: translate } : undefined}
      whileHover={{ y: -20 }}
      className="group/tile relative h-72 w-[22.5rem] shrink-0 md:h-96 md:w-[30rem]"
    >
      {/* Tiles are authored at 480x384 and scaled down as a unit on small
          screens, so their internal layout never has to reflow. */}
      <div className="h-96 w-[30rem] origin-top-left scale-75 md:scale-100">{tile.content}</div>
    </motion.div>
  );
};
