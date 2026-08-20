'use strict';

// Header background swap on scroll (kept subtle since header is gradient by default)
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
	header.classList.toggle('is-scrolled', window.scrollY > 10);
}, { passive: true });

// Hamburger menu
const hamburger = document.getElementById('hamburger');
const spNav = document.getElementById('spNav');

if (hamburger && spNav) {
	hamburger.addEventListener('click', () => {
		const isOpen = header.classList.toggle('is-open');
		spNav.classList.toggle('is-open', isOpen);
		hamburger.setAttribute('aria-expanded', isOpen);
	});

	spNav.querySelectorAll('a').forEach(link => {
		link.addEventListener('click', () => {
			header.classList.remove('is-open');
			spNav.classList.remove('is-open');
			hamburger.setAttribute('aria-expanded', 'false');
		});
	});
}

// Marquee: keep the loop seamless at any viewport width
const marqueeTracks = document.querySelectorAll('[data-marquee]');

function fillMarquee(track) {
	if (!track.dataset.baseHtml) {
		track.dataset.baseHtml = track.innerHTML;
	}
	track.innerHTML = track.dataset.baseHtml;

	const parent = track.parentElement;
	const targetWidth = parent.clientWidth * 2;
	let guard = 0;

	while (track.scrollWidth < targetWidth && guard < 30) {
		track.insertAdjacentHTML('beforeend', track.dataset.baseHtml);
		guard += 1;
	}

	const items = track.querySelectorAll('span');
	if (items.length % 2 !== 0 && items.length > 0) {
		track.insertAdjacentHTML('beforeend', items[0].outerHTML);
	}

	const pxPerSecond = 40;
	const duration = Math.max(track.scrollWidth / 2 / pxPerSecond, 12);
	track.style.animationDuration = `${duration}s`;
}

function initMarquees() {
	marqueeTracks.forEach(fillMarquee);
}

if (marqueeTracks.length) {
	initMarquees();
	window.addEventListener('load', initMarquees);

	let resizeTimer;
	window.addEventListener('resize', () => {
		clearTimeout(resizeTimer);
		resizeTimer = window.setTimeout(initMarquees, 300);
	});
}

// なめらか＆ゆっくりしたイージングでスクロール（同一ページ内アンカー用）
function easeInOutCubic(t) {
	return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function smoothScrollTo(targetY, duration = 900) {
	const startY = window.scrollY;
	const distance = targetY - startY;
	const startTime = performance.now();

	function step(now) {
		const elapsed = Math.min((now - startTime) / duration, 1);
		const eased = easeInOutCubic(elapsed);
		window.scrollTo(0, startY + distance * eased);
		if (elapsed < 1) {
			window.requestAnimationFrame(step);
		}
	}

	window.requestAnimationFrame(step);
}

// スムーススクロール（固定ヘッダー分のオフセット込み）
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
	anchor.addEventListener('click', function (e) {
		const href = this.getAttribute('href');
		if (href === '#') return;
		const target = document.querySelector(href);
		if (!target) return;
		e.preventDefault();
		const headerHeight = header ? header.offsetHeight : 0;
		const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
		smoothScrollTo(top, 900);
	});
});

// ==========================================================================
// ページ遷移演出（フェードイン／フェードアウト）
// ==========================================================================
function closeMobileNav() {
	if (header) header.classList.remove('is-open');
	if (spNav) spNav.classList.remove('is-open');
	if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
}

function revealPage() {
	document.body.classList.remove('is-leaving');
	window.requestAnimationFrame(() => {
		document.body.classList.add('is-loaded');
	});
	// バックグラウンドタブ等でrequestAnimationFrameが止まる場合の保険
	window.setTimeout(() => {
		document.body.classList.add('is-loaded');
	}, 100);
}
window.addEventListener('pageshow', revealPage);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('click', (event) => {
	const link = event.target.closest('a[href]');
	if (!link) return;
	if (link.target === '_blank' || link.hasAttribute('download')) return;
	if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

	let url;
	try {
		url = new URL(link.getAttribute('href'), window.location.href);
	} catch (err) {
		return;
	}

	if (!/^https?:$/.test(url.protocol) || url.origin !== window.location.origin) return;
	if (url.pathname === window.location.pathname) return; // 同一ページ内アンカーはスムーススクロールに任せる

	if (prefersReducedMotion) return;

	event.preventDefault();
	closeMobileNav();
	document.body.classList.add('is-leaving');
	window.setTimeout(() => {
		window.location.href = link.href;
	}, 420);
});

// ==========================================================================
// スクロールフェードイン（reveal）
// ==========================================================================
const revealItems = document.querySelectorAll('.reveal');

if (revealItems.length) {
	if ('IntersectionObserver' in window) {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('is-inview');
						observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
		);
		revealItems.forEach((el) => observer.observe(el));

		// バックグラウンドタブ等でIntersectionObserverが発火しない場合の保険
		window.setTimeout(() => {
			revealItems.forEach((el) => el.classList.add('is-inview'));
		}, 4000);
	} else {
		revealItems.forEach((el) => el.classList.add('is-inview'));
	}
}
