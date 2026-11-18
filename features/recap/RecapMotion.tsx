"use client";

import { createRollingNumber } from "@kitlangton/rolling-number";
import { useEffect, useRef, useState } from "react";

const chapters = [
	["recap", "Opening"],
	["the-guide", "The guide"],
	["signals-title", "Your response"],
	["rhythm-title", "The weekend"],
	["sound-title", "The soundtrack"],
	["favourites-title", "The shortlist"],
	["ending-title", "Until next time"],
] as const;

export function ChapterProgress() {
	const [active, setActive] = useState(0);
	useEffect(() => {
		const sections = chapters.map(([id]) => {
			const target = document.getElementById(id);
			return (
				target?.closest("section, header") ??
				document.querySelector(".recap-hero")
			);
		});
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries)
					if (entry.isIntersecting) setActive(sections.indexOf(entry.target));
			},
			{ rootMargin: "-20% 0px -60% 0px", threshold: 0 },
		);
		sections.forEach((section) => {
			if (section) observer.observe(section);
		});
		return () => observer.disconnect();
	}, []);
	return (
		<div className="chapter-progress" aria-label="Story chapters">
			{chapters.map(([id, label], i) => (
				<a
					key={id}
					href={`#${id}`}
					aria-label={`${i + 1}. ${label}`}
					aria-current={active === i ? "step" : undefined}
					data-complete={i <= active}
					title={label}
				>
					<span>{label}</span>
				</a>
			))}
		</div>
	);
}

export function RecapMotion() {
	useEffect(() => {
		const motion = matchMedia("(prefers-reduced-motion: reduce)");
		const sections = document.querySelectorAll<HTMLElement>(
			".recap [data-reveal], .recap [data-roll], .recap [data-route-entry], .recap [data-typewriter]",
		);
		const counters: ReturnType<typeof createRollingNumber>[] = [];
		const frames: number[] = [];
		const delays: ReturnType<typeof setTimeout>[] = [];
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add("is-in-view");
						const target = entry.target as HTMLElement;
						const reel =
							target.querySelector<HTMLElement>(".recap-number-reel");
						if (reel && target.dataset.roll && !motion.matches) {
							const counter = createRollingNumber(reel, {
								value: 0,
								locales: "en-GB",
								duration: Number(target.dataset.duration || 900),
								direction: "up",
								pauseOffscreen: true,
							});
							counters.push(counter);
							target.classList.add("is-rolling");
							delays.push(
								setTimeout(
									() => {
										frames.push(
											requestAnimationFrame(() =>
												counter.update({ value: Number(target.dataset.roll) }),
											),
										);
									},
									Number(target.dataset.delay || 0),
								),
							);
						}
						observer.unobserve(entry.target);
					}
				}
			},
			{ threshold: 0.12, rootMargin: "0px 0px -12% 0px" },
		);
		if (!motion.matches)
			sections.forEach((section) => {
				if (section.hasAttribute("data-typewriter"))
					section.classList.add("typewriter-ready");
				if (section.hasAttribute("data-reveal"))
					section.classList.add("will-reveal");
				observer.observe(section);
			});
		return () => {
			observer.disconnect();
			frames.forEach(cancelAnimationFrame);
			delays.forEach(clearTimeout);
			counters.forEach((counter) => counter.destroy());
			sections.forEach((section) => section.classList.remove("is-rolling"));
			sections.forEach((section) =>
				section.classList.remove("will-reveal", "typewriter-ready"),
			);
		};
	}, []);
	return null;
}

export function Soundtrack() {
	const audio = useRef<HTMLAudioElement>(null);
	const [playing, setPlaying] = useState(false);
	const [error, setError] = useState(false);
	const [waveVisible, setWaveVisible] = useState(false);
	useEffect(() => {
		const wave = audio.current
			?.closest("section")
			?.querySelector(".recap-waveform");
		if (!wave) return;
		const observer = new IntersectionObserver(([entry]) =>
			setWaveVisible(entry.isIntersecting),
		);
		observer.observe(wave);
		return () => observer.disconnect();
	}, []);
	useEffect(() => {
		const pause = () => {
			if (document.hidden) audio.current?.pause();
		};
		document.addEventListener("visibilitychange", pause);
		return () => document.removeEventListener("visibilitychange", pause);
	}, []);
	return (
		<div className="recap-player" data-wave-active={playing && waveVisible}>
			<audio
				ref={audio}
				src="/recap/soundtrack.mp3"
				preload="none"
				loop
				onPlay={() => setPlaying(true)}
				onPause={() => setPlaying(false)}
				onError={() => {
					setPlaying(false);
					setError(true);
				}}
			/>
			<button
				type="button"
				aria-pressed={playing}
				onClick={async () => {
					if (!audio.current) return;
					if (playing) audio.current.pause();
					else {
						try {
							await audio.current.play();
							setError(false);
						} catch {
							setError(true);
						}
					}
				}}
			>
				<span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>{" "}
				{playing ? "Pause the soundtrack" : "Play the soundtrack"}
			</button>
			<small>
				{error
					? "Audio could not load. Try again."
					: "Mauvais Djo · Pile · a moment from the recap"}
			</small>
		</div>
	);
}

export function TypewriterTitle() {
	const heading = useRef<HTMLHeadingElement>(null);
	const [count, setCount] = useState(15);
	const [enabled, setEnabled] = useState(false);
	useEffect(() => {
		const reduced = matchMedia("(prefers-reduced-motion: reduce)");
		if (!heading.current || reduced.matches) return;
		setEnabled(true);
		setCount(0);
		const timers: ReturnType<typeof setTimeout>[] = [];
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				observer.disconnect();
				[
					100, 185, 260, 490, 575, 650, 890, 975, 1050, 1290, 1375, 1450, 1540,
					1620, 1830,
				].forEach((delay, index) => {
					timers.push(setTimeout(() => setCount(index + 1), delay));
				});
			},
			{ threshold: 0.25 },
		);
		observer.observe(heading.current);
		const stop = () => {
			if (!reduced.matches) return;
			observer.disconnect();
			timers.forEach(clearTimeout);
			setCount(15);
			setEnabled(false);
		};
		reduced.addEventListener("change", stop);
		return () => {
			observer.disconnect();
			timers.forEach(clearTimeout);
			reduced.removeEventListener("change", stop);
		};
	}, []);
	return (
		<h2
			id="ending-title"
			className="terminal-title"
			ref={heading}
			aria-label="See you out there."
		>
			{"See you out there.".split(" ").map((word, wi) => (
				<span className="terminal-word" key={word} aria-hidden="true">
					{word.split("").map((letter, li) => {
						const index = [0, 3, 6, 9][wi] + li;
						const cursorHere = enabled && index === Math.max(0, count - 1);
						return (
							<span className="terminal-letter" key={`${word}-${li}`}>
								<span
									style={{ visibility: index < count ? "visible" : "hidden" }}
								>
									{letter}
								</span>
								{cursorHere && (
									<span
										className={`terminal-caret${count === 15 ? " is-finished" : ""}${count === 0 ? " at-start" : ""}`}
									/>
								)}
							</span>
						);
					})}
					{wi < 3 ? " " : null}
				</span>
			))}
		</h2>
	);
}
