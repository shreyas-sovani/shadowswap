import React, { useCallback, useRef } from "react";

import { useMousePosition } from "@/components/hooks/use-mouse-position";
import { motion, useAnimationFrame } from "framer-motion";

interface FontVariationAxis {
    name: string;
    min: number;
    max: number;
}

interface FontVariationMapping {
    x: FontVariationAxis;
    y: FontVariationAxis;
}

interface TextProps {
    label: string;
    fontVariationMapping: FontVariationMapping;
    containerRef: React.RefObject<HTMLDivElement | null>;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

const VariableFontAndCursor = ({
    label,
    fontVariationMapping,
    className,
    style,
    containerRef,
    onClick,
    ...props
}: TextProps) => {
    const mousePosition = useMousePosition(containerRef);
    const spanRef = useRef<HTMLSpanElement>(null);

    const interpolateFontVariationSettings = useCallback(
        (xPosition: number, yPosition: number) => {
            const container = containerRef.current;
            if (!container) return "0 0"; // Return default values if container is null

            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;

            const xProgress = Math.min(Math.max(xPosition / containerWidth, 0), 1);
            const yProgress = Math.min(Math.max(yPosition / containerHeight, 0), 1);

            const xValue =
                fontVariationMapping.x.min +
                (fontVariationMapping.x.max - fontVariationMapping.x.min) * xProgress;
            const yValue =
                fontVariationMapping.y.min +
                (fontVariationMapping.y.max - fontVariationMapping.y.min) * yProgress;

            return `'${fontVariationMapping.x.name}' ${xValue}, '${fontVariationMapping.y.name}' ${yValue}`;
        },
        [containerRef, fontVariationMapping]
    );

    useAnimationFrame(() => {
        const settings = interpolateFontVariationSettings(
            mousePosition.x,
            mousePosition.y
        );
        if (spanRef.current) {
            spanRef.current.style.fontVariationSettings = settings;
        }
    });

    return (
        <motion.span
            ref={spanRef}
            className={`${className} inline-block`}
            style={style}
            onClick={onClick}
            {...props}
        >
            {label}
        </motion.span>
    );
};

export { VariableFontAndCursor };
