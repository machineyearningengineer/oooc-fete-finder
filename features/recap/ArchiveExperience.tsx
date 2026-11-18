"use client";

import { ArrowUpRight } from "lucide-react";
import { usePathname } from "next/navigation";
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

const ArchiveContext = createContext({ visible: true, reveal: () => {} });

export function ArchiveExperience({
	children,
	enabled,
}: { children: ReactNode; enabled: boolean }) {
	const pathname = usePathname();
	const [revealed, setRevealed] = useState(false);
	const reveal = useCallback(() => {
		setRevealed(true);
		try {
			sessionStorage.setItem("fete-guide-revealed", "1");
		} catch {
			/* Storage can be unavailable in private contexts. */
		}
	}, []);
	useEffect(() => {
		try {
			if (sessionStorage.getItem("fete-guide-revealed") === "1") reveal();
		} catch {
			/* The viewport observer remains the fallback. */
		}
		if (
			pathname === "/" &&
			(window.location.search ||
				["#finder", "#all-events", "#event-map"].includes(window.location.hash))
		)
			reveal();
	}, [pathname, reveal]);
	return (
		<ArchiveContext.Provider
			value={{
				visible: !enabled || pathname !== "/" || revealed,
				reveal,
			}}
		>
			{children}
		</ArchiveContext.Provider>
	);
}

export function ArchiveChrome({ children }: { children: ReactNode }) {
	const { visible } = useContext(ArchiveContext);
	const pathname = usePathname();
	const [readingStory, setReadingStory] = useState(pathname === "/");
	useEffect(() => {
		const story = pathname === "/" ? document.getElementById("recap") : null;
		if (!story) {
			setReadingStory(false);
			return;
		}
		const observer = new IntersectionObserver(
			([entry]) => setReadingStory(entry.boundingClientRect.bottom > 1),
			{ rootMargin: "-1px 0px 0px 0px" },
		);
		observer.observe(story);
		return () => observer.disconnect();
	}, [pathname]);
	return visible && !readingStory ? children : null;
}

export function ArchiveReveal({ children }: { children: ReactNode }) {
	const { visible, reveal } = useContext(ArchiveContext);
	const target = useRef<HTMLElement>(null);
	useEffect(() => {
		if (visible && window.location.hash === "#finder") {
			requestAnimationFrame(() => {
				target.current?.scrollIntoView({ block: "start", behavior: "instant" });
				target.current?.focus({ preventScroll: true });
			});
		}
	}, [visible]);
	useEffect(() => {
		if (!target.current || visible) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) reveal();
			},
			{ rootMargin: "120px" },
		);
		observer.observe(target.current);
		const checkRestoredPosition = () => {
			const bounds = target.current?.getBoundingClientRect();
			if (
				bounds &&
				bounds.top < window.innerHeight + 120 &&
				bounds.bottom > -120
			)
				reveal();
		};
		checkRestoredPosition();
		window.addEventListener("pageshow", checkRestoredPosition);
		return () => {
			observer.disconnect();
			window.removeEventListener("pageshow", checkRestoredPosition);
		};
	}, [visible, reveal]);
	return (
		<section
			id="finder"
			ref={target}
			className="archive-reveal"
			aria-label="Explore the Fête Finder archive"
			tabIndex={-1}
		>
			<div className="archive-ribbon">
				<span>THE 2026 ARCHIVE</span>
				<p>Same city. Your own route. Browse the guide below.</p>
				<a href="/archive">
					Open app on its own{" "}
					<ArrowUpRight className="recap-inline-icon" aria-hidden="true" />
				</a>
			</div>
			{visible ? (
				children
			) : (
				<div className="archive-loading">
					<span className="archive-loading-eyebrow">
						THE WEEKEND ENDED. THE POSSIBILITIES DIDN’T.
					</span>
					<h2>
						One more <em>detour?</em>
					</h2>
					<p>
						The Paris guide is yours to keep. Find a favourite, trace a route,
						make it your own.
					</p>
					<a href="/archive">
						Step inside the guide{" "}
						<ArrowUpRight className="recap-inline-icon" aria-hidden="true" />
					</a>
				</div>
			)}
		</section>
	);
}
