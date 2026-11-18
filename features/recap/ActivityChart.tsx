"use client";

import recap from "@/data/recap-2026.json";
import { createRollingNumber } from "@kitlangton/rolling-number";
import { Compass } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const labels = [
	"Friday 19 June",
	"Saturday 20 June",
	"Sunday 21 June",
	"Monday 22 June",
];
const totalActions = recap.dailyActivity.reduce(
	(total, day) => total + day.actions,
	0,
);

const points = [
	[80, 205],
	[360, 155],
	[640, 35],
	[920, 218],
];

function RollingTotal({ value }: { value: number }) {
	const mount = useRef<HTMLSpanElement>(null);
	const counter = useRef<ReturnType<typeof createRollingNumber> | null>(null);
	const initialValue = useRef(value);
	const [ready, setReady] = useState(false);
	useEffect(() => {
		if (!mount.current) return;
		counter.current = createRollingNumber(mount.current, {
			value: initialValue.current,
			locales: "en-GB",
			duration: 280,
		});
		setReady(true);
		return () => {
			counter.current?.destroy();
			counter.current = null;
		};
	}, []);
	useEffect(() => {
		counter.current?.update({ value });
	}, [value]);
	return (
		<span className={`recap-number${ready ? " is-rolling" : ""}`}>
			<span className="recap-number-text">{value.toLocaleString("en-GB")}</span>
			<span className="recap-number-reel" aria-hidden="true" ref={mount} />
		</span>
	);
}

export function ActivityChart() {
	const [selected, setSelected] = useState(2);
	const chart = useRef<HTMLDivElement>(null);
	const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
	const [arrival, setArrival] = useState<number | null>(null);
	const interrupted = useRef(false);
	const chooseDay = (day: number) => {
		interrupted.current = true;
		timers.current.forEach(clearTimeout);
		setArrival(null);
		setSelected(day);
	};
	useEffect(() => {
		const target = chart.current;
		const reduced = matchMedia("(prefers-reduced-motion: reduce)");
		if (!target || reduced.matches) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (
					!entry.isIntersecting ||
					entry.intersectionRatio < 0.5 ||
					interrupted.current
				)
					return;
				observer.disconnect();
				setSelected(0);
				setArrival(0);
				[1, 2].forEach((day) => {
					timers.current.push(
						setTimeout(() => {
							setArrival(null);
							setSelected(day);
						}, day * 1400),
					);
					timers.current.push(
						setTimeout(() => setArrival(day), day * 1400 + 550),
					);
				});
			},
			{ threshold: 0.5 },
		);
		observer.observe(target);
		const stopForReducedMotion = () => {
			if (!reduced.matches) return;
			timers.current.forEach(clearTimeout);
			observer.disconnect();
			setArrival(null);
			setSelected(2);
		};
		reduced.addEventListener("change", stopForReducedMotion);
		return () => {
			observer.disconnect();
			timers.current.forEach(clearTimeout);
			reduced.removeEventListener("change", stopForReducedMotion);
		};
	}, []);
	const [x, y] = points[selected];
	const actions = recap.dailyActivity[selected].actions;
	const share = Math.round((actions / totalActions) * 100);
	const previous = recap.dailyActivity[selected - 1]?.actions;
	const change = previous
		? Math.round(((actions - previous) / previous) * 100)
		: null;
	const comparison =
		change === null
			? "The opening day · our starting point"
			: `${Math.abs(change)}% ${change >= 0 ? "more" : "fewer"} actions than ${labels[selected - 1].split(" ")[0]}`;
	const description = `${labels[selected]}: ${recap.dailyActivity[selected].actions.toLocaleString("en-GB")} recorded actions`;
	return (
		<div className="recap-chart scrapbook-chart">
			<div className="scrapbook-masthead" aria-hidden="true">
				<span>OOOC / FIELD NOTES</span>
				<span>PARIS · JUIN 2026</span>
				<Compass strokeWidth={1} />
			</div>
			<div className="scrapbook-topline">
				<p className="scrapbook-note">
					Four days. Percentages are rounded.
					<br />
					One city.
					<br />
					<em>A few good detours.</em>
				</p>
				<div className="scrapbook-legend">
					<span>THE WEEKEND, TRACED</span>
					<span>
						<i /> Recorded actions
					</span>
					<span>
						<b /> A day in the guide
					</span>
				</div>
			</div>
			<p className="chart-instruction" id="chart-instruction">
				Drag across the curve, or choose a day below.
			</p>
			<div className="scrapbook-map" aria-hidden="true" />
			<div className="chart-scrubber" ref={chart} data-reveal>
				<svg
					viewBox="0 -35 1000 405"
					role="img"
					aria-label="Recorded actions rose from 7,844 on Friday to 13,280 on Saturday, peaked at 26,378 on Sunday, then fell to 6,177 on Monday."
				>
					<defs>
						<linearGradient id="recap-wave-fill" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0" stopColor="#c5a557" stopOpacity=".5" />
							<stop offset="1" stopColor="#c5a557" stopOpacity="0" />
						</linearGradient>
					</defs>
					<path
						className="chart-grid"
						d="M70 270H930M70 200H930M70 130H930M70 60H930M80 30V270M360 30V270M640 30V270M920 30V270"
					/>
					<path
						className="chart-area"
						d="M80 205C200 205 240 170 360 155S520 40 640 35S780 220 920 218V270H80Z"
						fill="url(#recap-wave-fill)"
					/>
					<path
						className="chart-line"
						d="M80 205C200 205 240 170 360 155S520 40 640 35S780 220 920 218"
						pathLength="1"
					/>
					{[
						[80, 205],
						[360, 155],
						[640, 35],
						[920, 218],
					].map(([x, y]) => (
						<circle
							key={x}
							cx={x}
							cy={y}
							r="8"
							className={x === 640 ? "chart-peak" : "chart-dot"}
						/>
					))}
					<line
						x1="0"
						x2="0"
						y1="0"
						y2="-1"
						className={`chart-cursor-line chart-guide-slide${arrival === 0 ? " chart-guide-start" : ""}`}
						vectorEffect="non-scaling-stroke"
						style={{ transform: `translate(${x}px, 270px) scaleY(${270 - y})` }}
					/>
					<g
						className={`chart-traveller${arrival === 0 ? " chart-traveller-start" : ""}`}
						style={{ transform: `translate(${x}px, ${y}px)` }}
					>
						<circle r="14" className="chart-cursor" />
						{arrival !== null && (
							<g
								key={arrival}
								className={`chart-arrival${arrival === 2 ? " chart-arrival-peak" : ""}`}
							>
								<circle className="chart-ripple" r="18" />
								<circle className="chart-impact" r="14" />
							</g>
						)}
					</g>
					<text x="640" y="-5" textAnchor="middle" className="chart-annotation">
						the Sunday crescendo
					</text>
				</svg>
				<input
					className="chart-range"
					type="range"
					min="0"
					max="3"
					step="1"
					value={selected}
					onChange={(event) => chooseDay(Number(event.target.value))}
					aria-label="Explore weekend activity"
					aria-valuetext={description}
					aria-describedby="chart-instruction"
				/>
			</div>
			<p
				className="chart-readout chart-insights"
				aria-live="polite"
				aria-atomic="true"
			>
				<span>{labels[selected]}</span>
				<strong>
					<RollingTotal value={share} />%
				</strong>
				<small>OF ALL FOUR DAYS’ ACTIONS</small>
				<span className="chart-comparison">{comparison}</span>
			</p>
			<p className="scrapbook-caption">
				The city got louder through the weekend.
			</p>
			<ol className="recap-days">
				{recap.dailyActivity.map((day, i) => (
					<li key={day.day}>
						<button
							type="button"
							aria-pressed={i === selected}
							onClick={() => chooseDay(i)}
						>
							<span>{["FRI 19", "SAT 20", "SUN 21", "MON 22"][i]}</span>
							<strong>{day.actions.toLocaleString("en-GB")}</strong>
							<small>recorded actions</small>
						</button>
					</li>
				))}
			</ol>
			<p className="scrapbook-provenance">
				PARIS, FRANCE / 19—22 JUNE · Daily totals; the curve connects recorded
				days. Percentages are rounded.
			</p>
		</div>
	);
}
