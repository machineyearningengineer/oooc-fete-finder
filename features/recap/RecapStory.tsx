import recap from "@/data/recap-2026.json";
import {
	ArrowUpRight,
	ArrowDown,
	ArrowRight,
	Asterisk,
	Heart,
	MapPin,
	Moon,
	Ticket,
} from "lucide-react";
import { ActivityChart } from "./ActivityChart";
import {
	ChapterProgress,
	RecapMotion,
	Soundtrack,
	TypewriterTitle,
} from "./RecapMotion";

const number = (value: number) => value.toLocaleString("en-GB");
const genres = recap.catalog.topGenres.slice(0, 6);

function RecapNumber({
	value,
	duration = 900,
	delay = 0,
}: { value: number; duration?: number; delay?: number }) {
	return (
		<span
			className="recap-number"
			data-roll={value}
			data-duration={duration}
			data-delay={delay}
		>
			<span className="recap-number-text">{number(value)}</span>
			<span className="recap-number-reel" aria-hidden="true" />
		</span>
	);
}

function RouteTrace({ className = "" }: { className?: string }) {
	const route =
		"M370 20 C90 70 550 180 320 260 C205 300 50 300 90 355 C100 369 106 378 120 390 C190 450 380 445 430 490 C460 517 445 525 420 545 C340 609 150 575 185 630 C192 641 200 654 210 665";
	return (
		<svg
			className={`recap-route ${className}`}
			viewBox="0 0 600 700"
			fill="none"
			aria-hidden="true"
			data-route-entry
		>
			<path
				className="trace"
				d={route}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path className="route-energy" d={route} pathLength="1" />
			{[
				[370, 20],
				[320, 260],
				[120, 390],
				[420, 545],
			].map(([x, y], i) => (
				<g key={x} className="route-stop">
					<circle cx={x} cy={y} r="22" />
					<circle className="route-stop-ring" cx={x} cy={y} r="17" />
					<text x={x} y={y + 6}>
						{i + 1}
					</text>
				</g>
			))}
			<path d="m195 650 30 30m0-30-30 30" strokeWidth="4" />
		</svg>
	);
}

export function RecapStory() {
	return (
		<main className="recap" id="recap" aria-label="The Fête Finder 2026 story">
			<RecapMotion />
			<nav className="recap-nav" aria-label="Recap navigation">
				<a
					href="#recap"
					className="recap-wordmark"
					aria-label="Out of Office Collective"
				>
					OOOC<span>OUT OF OFFICE COLLECTIVE</span>
				</a>
				<a className="recap-skip" href="#finder">
					Skip to the app{" "}
					<span aria-hidden="true">
						<ArrowUpRight className="recap-inline-icon" />
					</span>
				</a>
				<ChapterProgress />
			</nav>
			<header className="recap-hero">
				<div className="recap-hero-image" />
				<div className="recap-hero-copy">
					<p className="recap-eyebrow">FÊTE FINDER / THE 2026 RECAP</p>
					<h1>
						We made
						<br />a list for
						<br />
						<em>the group chat.</em>
					</h1>
					<p className="recap-opening">
						Then it got passed round. By the end of June it had{" "}
						{number(recap.pageViews)} page views and{" "}
						{number(recap.outboundClicks)} clicks through to the parties.
					</p>
					<a className="recap-scroll" href="#the-guide">
						<span aria-hidden="true">
							<ArrowDown className="recap-inline-icon" />
						</span>{" "}
						See how it went
					</a>
				</div>
				<div className="hero-atlas">
					<div className="hero-atlas-heading" aria-hidden="true">
						<span>48°51′ N · 2°21′ E</span>
						<strong>Paris</strong>
						<span>19—22 JUIN / 2026</span>
					</div>
					<svg
						className="hero-postmark"
						viewBox="0 0 140 140"
						aria-hidden="true"
					>
						<circle cx="70" cy="70" r="65" />
						<circle className="postmark-inner" cx="70" cy="70" r="58" />
						<text className="postmark-label" x="70" y="40">
							OUT OF OFFICE
						</text>
						<text className="postmark-brand" x="70" y="79">
							OOOC
						</text>
						<path d="M40 91H100" />
						<text className="postmark-label" x="70" y="108">
							PARIS · FRANCE
						</text>
					</svg>
					<RouteTrace className="hero-trace" />
					<p className="hero-map-note" aria-hidden="true">
						Stop 4: TBC.
					</p>
					<a
						className="recap-ticket"
						href="#the-guide"
						aria-label="Explore the Fête Finder 2026 recap"
					>
						<span>19–22 JUIN · 159 LISTINGS</span>
						<strong>FÊTE FINDER</strong>
						<span>PARIS · 2026 · THE RECAP</span>
						<i>
							TAKE A LOOK{" "}
							<ArrowUpRight className="recap-inline-icon" aria-hidden="true" />
						</i>
					</a>
				</div>
				<div className="recap-hero-footer">
					<span>FROM THE OOOC GROUP CHAT</span>
					<span>TO 159 PARTIES IN PARIS</span>
				</div>
			</header>

			<section
				className="recap-chapter recap-guide"
				id="the-guide"
				aria-labelledby="guide-title"
			>
				<div className="recap-section-label">
					<span>01 / WHY IT EXISTS</span>
					<span>THE GUIDE</span>
				</div>
				<div className="recap-split" data-reveal>
					<h2 id="guide-title">
						It started with
						<br />
						“where are
						<br />
						<em>we going?”</em>
					</h2>
					<div className="recap-prose">
						<p>
							Every Fête, the chat asks the same things. Is it free? Is it near
							us? Is anything still on after midnight?
						</p>
						<p>
							So we put the answers in one place, instead of a pile of
							screenshots.
						</p>
						<span className="recap-handwritten">
							The plan will still change at 1am.
						</span>
					</div>
				</div>
				<div className="recap-print-stats" data-reveal>
					<p className="recap-print-heading">The 2026 guide</p>
					<dl className="recap-stat-grid">
						{[
							{
								Icon: Ticket,
								value: recap.catalog.events,
								label: "Listings",
							},
							{
								Icon: Heart,
								value: recap.catalog.freeEvents,
								label: "Free events",
							},
							{
								Icon: Moon,
								value: recap.catalog.lateNightEvents,
								label: "Late ones (10pm+ or past midnight)",
							},
							{
								Icon: MapPin,
								value: recap.catalog.eventsWithLocation,
								label: "With a pin on the map",
							},
						].map(({ Icon, value, label }, i) => (
							<div key={label}>
								<dt>
									<Icon aria-hidden="true" strokeWidth={1.25} />
									<span>{label}</span>
								</dt>
								<dd>
									<RecapNumber value={value} duration={750} delay={i * 100} />
								</dd>
							</div>
						))}
					</dl>
					<div className="recap-postmark" aria-hidden="true">
						MERCI
						<br />
						BEAUCOUP
						<span>
							<Asterisk className="recap-inline-icon" aria-hidden="true" />
						</span>
					</div>
				</div>
			</section>

			<section
				className="recap-chapter recap-signals"
				aria-labelledby="signals-title"
			>
				<div className="recap-section-label">
					<span>02 / FROM THE GROUP CHAT TO THE STREET</span>
					<span>THE RESPONSE</span>
				</div>
				<div className="recap-split" data-reveal>
					<h2 id="signals-title">
						And then,
						<br />
						<em>you showed up.</em>
					</h2>
					<p className="recap-prose">
						On the train. Outside the venue. Somewhere between “send the link”
						and “meet you there.” The guide kept moving with you.
					</p>
				</div>
				<div className="response-dispatch" aria-hidden="true">
					<span>PARIS / FIELD REPORT</span>
					<span>A link worth passing on.</span>
					<span>
						JUIN 2026{" "}
						<ArrowUpRight className="recap-inline-icon" aria-hidden="true" />
					</span>
				</div>
				<div className="recap-pageviews" data-reveal>
					<strong>
						<RecapNumber value={recap.pageViews} duration={1900} />
					</strong>
					<div>
						<span>PAGE VIEWS IN JUNE</span>
						<p>
							A little website.
							<br />
							<em>A lot of next moves.</em>
						</p>
					</div>
				</div>
				<dl className="recap-actions" id="response-actions" data-reveal>
					<div>
						<dt>
							<ArrowUpRight aria-hidden="true" strokeWidth={1.25} />
							<span className="response-action-title">
								Following the feeling
							</span>
						</dt>
						<dd>
							<RecapNumber value={recap.outboundClicks} duration={850} />
						</dd>
						<span>Outbound clicks</span>
					</div>
					<div>
						<dt>
							<Heart aria-hidden="true" strokeWidth={1.25} />
							<span className="response-action-title">“Keep this one”</span>
						</dt>
						<dd>
							<RecapNumber
								value={recap.saveToggles}
								duration={850}
								delay={140}
							/>
						</dd>
						<span>Save / unsave actions</span>
					</div>
					<div>
						<dt>
							<MapPin aria-hidden="true" strokeWidth={1.25} />
							<span className="response-action-title">Finding the way</span>
						</dt>
						<dd>
							<RecapNumber value={recap.mapOpens} duration={850} delay={280} />
						</dd>
						<span>Event map opens</span>
					</div>
				</dl>
				<p className="recap-footnote">
					Recorded interactions, not attendance or unique people. June 2026.
				</p>
			</section>

			<section
				className="recap-chapter recap-rhythm"
				aria-labelledby="rhythm-title"
			>
				<div className="recap-section-label">
					<span>03 / THE WEEKEND, IN MOTION</span>
					<span>THE BUILD-UP</span>
				</div>
				<div className="recap-split" data-reveal>
					<h2 id="rhythm-title">
						Friday whispered.
						<br />
						Sunday <em>yelled.</em>
					</h2>
					<p className="recap-prose">
						The warm-up. The late one. The day the whole city seemed to spill
						outside. You can almost hear the weekend in the curve.
					</p>
				</div>
				<ActivityChart />
			</section>

			<section
				className="recap-chapter recap-sound"
				aria-labelledby="sound-title"
			>
				<div className="recap-section-label">
					<span>04 / NO SUCH THING AS BACKGROUND MUSIC</span>
					<span>THE SOUNDTRACK</span>
				</div>
				<div className="recap-split">
					<div data-reveal>
						<h2 id="sound-title">
							The soundtrack
							<br />
							was <em>not subtle.</em>
						</h2>
						<p className="recap-prose">
							Bass around the corner. A familiar hook from an open door.
							Afrobeats to Amapiano, and every reason to stay for one more.
						</p>
						<Soundtrack />
					</div>
					<ol
						className="recap-genres"
						aria-label="Music genres by number of 2026 listings"
					>
						{genres.map((genre, i) => (
							<li key={genre.label} data-reveal>
								<span className="genre-position">0{i + 1}</span>
								<span className="genre-name">{genre.label}</span>
								<strong>
									<RecapNumber value={genre.value} duration={450} />
								</strong>
								<div
									className="genre-line"
									style={{ width: `${(genre.value / genres[0].value) * 100}%` }}
								/>
							</li>
						))}
						<li className="recap-footnote">
							Listings tagged with each genre; an event can have several.
						</li>
					</ol>
				</div>
				<div className="recap-waveform" data-reveal aria-hidden="true">
					{Array.from({ length: 90 }, (_, i) => (
						<i
							key={`wave-${i}`}
							style={{
								transitionDelay: `${i * 12}ms`,
								height: `${12 + Math.abs(Math.sin(i * 0.7) * Math.sin(i * 0.12)) * 100}%`,
							}}
						/>
					))}
				</div>
			</section>

			<section
				className="recap-chapter recap-favourites"
				aria-labelledby="favourites-title"
			>
				<div className="recap-section-label">
					<span>05 / THE ONES THAT KEPT COMING UP</span>
					<span>THE SHORTLIST</span>
				</div>
				<div className="recap-split">
					<div data-reveal>
						<h2 id="favourites-title">
							Some names
							<br />
							stayed in
							<br />
							<em>the chat.</em>
						</h2>
						<p className="recap-prose">
							The listings you opened, saved, mapped and passed on. A few of the
							weekend’s most revisited possibilities.
						</p>
					</div>
					<ol className="recap-favourite-list">
						{recap.topEvents.map((event, i) => (
							<li key={event.eventKey} data-reveal>
								<span>0{i + 1}</span>
								<div>
									<a href={`/event/${event.eventKey}`}>{event.title}</a>
									<small>{number(event.totalActions)} recorded actions</small>
								</div>
								<span aria-hidden="true">
									<ArrowUpRight className="recap-inline-icon" />
								</span>
							</li>
						))}
					</ol>
				</div>
				<p className="recap-footnote">
					Recorded event interactions, including opens, save toggles, map opens,
					calendar saves and outbound clicks. Not an attendance ranking.
				</p>
			</section>

			<section
				className="recap-chapter recap-ending"
				aria-labelledby="ending-title"
			>
				<div className="recap-postcard" data-reveal>
					<img
						className="postcard-art"
						src="/recap/paris-closing-postcard.webp"
						alt=""
						loading="lazy"
						decoding="async"
						width="1536"
						height="1024"
					/>
					<div className="postcard-masthead">
						<span>OOOC FÊTE FINDER 2026</span>
						<span>
							<i aria-hidden="true">
								<Asterisk className="recap-inline-icon" />
							</i>{" "}
							THE RECAP
						</span>
					</div>
					<div className="recap-ending-copy" data-reveal>
						<svg
							className="postcard-star"
							viewBox="0 0 100 100"
							aria-hidden="true"
						>
							<path
								fill="currentColor"
								d="M50 0 55 38 78 22 62 45 100 50 62 55 78 78 55 62 50 100 45 62 22 78 38 55 0 50 38 45 22 22 45 38Z"
							/>
						</svg>
						<TypewriterTitle />
						<a
							className="recap-cta"
							href="https://www.outofofficecollective.co.uk/"
						>
							Stay in the loop{" "}
							<span aria-hidden="true">
								<ArrowRight className="recap-inline-icon" />
							</span>
						</a>
					</div>
					<svg
						className="postcard-route"
						viewBox="0 0 500 170"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M0 105C110 15 160 12 210 85S350 140 335 62S270 95 350 115S430 80 485 148"
							pathLength="1"
						/>
						<circle cx="485" cy="148" r="5" />
					</svg>
				</div>
				<div className="recap-postscript">
					<span>À bientôt, OOOC</span>
					<p>
						Still curious about Paris?
						<br />
						<a href="#finder">
							Keep scrolling. The guide is yours.{" "}
							<ArrowDown className="recap-inline-icon" aria-hidden="true" />
						</a>
					</p>
				</div>
				<div className="recap-source">
					<button type="button" popoverTarget="recap-source-note">
						A note on the numbers{" "}
						<ArrowUpRight className="recap-inline-icon" aria-hidden="true" />
					</button>
					<div
						id="recap-source-note"
						className="recap-source-popover"
						popover="auto"
						role="dialog"
						aria-labelledby="recap-source-title"
					>
						<h3 id="recap-source-title">A note on the numbers</h3>
						<button
							type="button"
							className="recap-source-close"
							popoverTarget="recap-source-note"
							popoverTargetAction="hide"
							aria-label="Close note"
						>
							×
						</button>
						<p>
							Event coverage comes from the 159 dated 2026 listings in our
							archived guide. Usage totals cover June 2026 and were verified
							against the production backup taken on 3 July. Daily activity uses
							Paris local dates. Sessions and actions are not unique people,
							ticket sales or attendance. The guide also preserves 80 listings
							from 2025.
						</p>
					</div>
				</div>
			</section>
		</main>
	);
}
