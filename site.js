// ร้านนี้แหละ download site: the version line, the language a visitor picked, the regulars' lines, the comments
// (the owner's Supabase project, rules in tools/site/comments.sql) and the download page's countdown.
// One file for the Thai and the English pages; the page's <html lang> picks the words.
(function () {
	"use strict";
	var SUPABASE = "https://dovodyfeffwachtbpqfm.supabase.co/rest/v1/comments";
	var KEY = "sb_publishable_Ml41kDKHxuClnk4n0ecAog_IRvT-kJA";   // public by design: comments.sql decides what it may do
	var RELEASE = "https://api.github.com/repos/intity01/ran-nee-lae-releases/releases/latest";
	var SETUP = "https://github.com/intity01/ran-nee-lae-releases/releases/latest/download/RanNeeLae-Setup.exe";
	var THREAD = "home";   // one conversation for both languages
	var en = document.documentElement.lang === "en";
	var WORDS = en ? {
		version: "Version ", anon: "Anonymous", sending: "Sending…", sent: "Thanks! It's up.", empty: "No comments yet. Be the first.",
		failed: "Couldn't send it. Try again in a moment.", slow: "That was quick: wait a minute and send again.",
		link: "Links can't be posted here.", tooLong: "Please keep it under 500 characters.", loadFailed: "Comments couldn't load right now.",
		say: function (n) { return n > 0 ? "Wrapping the shop up… " + n : "It's on its way. Check your browser's downloads."; }
	} : {
		version: "รุ่น ", anon: "ไม่ระบุชื่อ", sending: "กำลังส่ง…", sent: "ขอบคุณนะ ขึ้นแล้ว", empty: "ยังไม่มีความเห็น เป็นคนแรกเลย",
		failed: "ส่งไม่ได้ ลองใหม่อีกทีนะ", slow: "ส่งเร็วไปนิด รอสักนาทีแล้วส่งใหม่", link: "ใส่ลิงก์ในความเห็นไม่ได้นะ",
		tooLong: "ขอไม่เกิน 500 ตัวอักษรนะ", loadFailed: "ตอนนี้โหลดความเห็นไม่ได้",
		say: function (n) { return n > 0 ? "อีก " + n + " วิ ป้าห่อร้านอยู่" : "ส่งไปแล้ว ดูที่มุมเบราว์เซอร์นะ"; }
	};

	// The version line follows the newest release; the text in the page stays if GitHub does not answer.
	var versions = document.querySelectorAll("[data-version]");
	if (versions.length) {
		fetch(RELEASE).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); }).then(function (release) {
			var date = new Date(release.published_at).toLocaleDateString(en ? "en-GB" : "th-TH", {day: "numeric", month: "short", year: "numeric"});
			versions.forEach(function (el) { el.textContent = WORDS.version + release.tag_name.replace(/^v/, "") + " · " + date; });
		}).catch(function () {});
	}

	// A language picked by hand is remembered (the Thai page sends a non-Thai first visit to English).
	document.addEventListener("click", function (e) {
		var a = e.target.closest && e.target.closest("[hreflang]");
		if (a) { try { localStorage.setItem("lang", a.getAttribute("hreflang")); } catch (_) {} }
	});

	// The regulars: a press shows that person's line.
	var said = document.getElementById("said");
	document.querySelectorAll(".cast button").forEach(function (button, _, all) {
		button.addEventListener("click", function () {
			all.forEach(function (b) { b.setAttribute("aria-pressed", b === button ? "true" : "false"); });
			said.textContent = button.dataset.name + ": " + button.dataset.line;
		});
	});

	// The download page: count down, then start the installer; the button below always works by hand.
	var count = document.getElementById("countdown");
	if (count) {
		var left = 3;
		count.textContent = WORDS.say(left);
		var timer = setInterval(function () {
			left -= 1;
			count.textContent = WORDS.say(left);
			if (left <= 0) {
				clearInterval(timer);
				location.href = SETUP;
			}
		}, 1000);
	}

	var list = document.getElementById("comments");
	var form = document.getElementById("comment-form");
	if (!list) return;
	var status = document.getElementById("comment-status");
	var headers = {"apikey": KEY, "Content-Type": "application/json"};

	function when(iso) {
		return new Date(iso).toLocaleDateString(en ? "en-GB" : "th-TH", {day: "numeric", month: "short", year: "numeric"});
	}

	// Built with textContent only: nothing a visitor types is ever read as HTML.
	function show(rows) {
		list.textContent = "";
		if (!rows.length) {
			var none = document.createElement("li");
			none.textContent = WORDS.empty;
			list.appendChild(none);
		}
		rows.forEach(function (row) {
			var li = document.createElement("li");
			var who = document.createElement("b");
			who.textContent = row.name || WORDS.anon;
			var time = document.createElement("time");
			time.dateTime = row.created_at;
			time.textContent = when(row.created_at);
			var body = document.createElement("p");
			body.textContent = row.body;
			li.append(who, time, body);
			list.appendChild(li);
		});
	}

	function load() {
		fetch(SUPABASE + "?select=name,body,created_at&page=eq." + THREAD + "&order=created_at.desc&limit=50", {headers: headers})
			.then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
			.then(show)
			.catch(function () { list.textContent = ""; status.textContent = WORDS.loadFailed; });
	}

	form.addEventListener("submit", function (e) {
		e.preventDefault();
		var name = form.elements.name.value.trim().slice(0, 30);
		var body = form.elements.body.value.trim();
		if (!body) return;
		if (body.length > 500) { status.textContent = WORDS.tooLong; return; }
		if (/(https?:\/\/|www\.|\.com\b|\.net\b)/i.test(body)) { status.textContent = WORDS.link; return; }
		var send = form.querySelector("button");
		send.disabled = true;
		status.textContent = WORDS.sending;
		fetch(SUPABASE, {method: "POST", headers: Object.assign({"Prefer": "return=minimal"}, headers),
			body: JSON.stringify({page: THREAD, name: name, body: body, lang: en ? "en" : "th"})})
			.then(function (r) {
				if (r.ok) return;
				return r.json().then(function (err) { return Promise.reject(err && err.message); });
			})
			.then(function () { form.elements.body.value = ""; status.textContent = WORDS.sent; load(); })
			.catch(function (why) { status.textContent = why === "slow down" ? WORDS.slow : WORDS.failed; })
			.then(function () { send.disabled = false; });
	});
	load();
})();
