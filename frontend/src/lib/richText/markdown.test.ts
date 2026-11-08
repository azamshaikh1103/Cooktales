import assert from "node:assert/strict";
import {
	inlineMarkdownToHtml,
	markdownToHtml,
	markdownToPlainText,
	normalizePastedText,
	parseBlocks,
	tokenizeInline,
} from "./markdown";

// ---------------------------------------------------------------- full variant
assert.equal(
	inlineMarkdownToHtml("**bold** _it_ ~~gone~~ `code`"),
	"<strong>bold</strong> <em>it</em> <s>gone</s> <code>code</code>",
);
assert.equal(
	inlineMarkdownToHtml("**a _b_ c**"),
	"<strong>a <em>b</em> c</strong>",
	"nested emphasis",
);
// snake_case and emails must not be treated as formatting
assert.equal(
	inlineMarkdownToHtml("use snake_case_names"),
	"use snake_case_names",
);
assert.equal(
	inlineMarkdownToHtml("mail me@example.com"),
	"mail me@example.com",
);
// Links: label links, bare links, trailing punctuation stays outside the link
assert.equal(
	inlineMarkdownToHtml("[guide](https://a.com/x)"),
	'<a href="https://a.com/x">guide</a>',
);
assert.deepEqual(tokenizeInline("see https://a.com/x."), [
	{ type: "text", value: "see " },
	{ type: "url", href: "https://a.com/x" },
	{ type: "text", value: "." },
]);
// Unsafe schemes are never linked
assert.equal(
	inlineMarkdownToHtml("[x](javascript:alert(1))"),
	"[x](javascript:alert(1))",
);
// Everything is escaped, so markup in user text can never become HTML
assert.equal(
	markdownToHtml('<img src=x onerror="alert(1)">'),
	"<p>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p>",
);
assert.equal(inlineMarkdownToHtml("`<script>`"), "<code>&lt;script&gt;</code>");

const blocks = parseBlocks(
	"# Title\n\nIntro line\nsecond line\n\n- a\n- b\n\n1. one\n2. two\n\n> quoted\n> more\n\n```\ncode here\n  indented\n```\n\n#### deep",
);
assert.deepEqual(blocks, [
	{ type: "heading", level: 1, text: "Title" },
	{ type: "paragraph", lines: ["Intro line", "second line"] },
	{ type: "list", ordered: false, items: ["a", "b"] },
	{ type: "list", ordered: true, items: ["one", "two"] },
	{ type: "quote", lines: ["quoted", "more"] },
	{ type: "code", text: "code here\n  indented" },
	{ type: "heading", level: 3, text: "deep" },
]);
assert.deepEqual(parseBlocks("```\nabc"), [{ type: "code", text: "abc" }]);
assert.equal(
	markdownToHtml("```\n**not bold**\n```"),
	"<pre><code>**not bold**</code></pre>",
);
assert.equal(markdownToHtml("a\nb"), "<p>a<br>b</p>");
assert.equal(markdownToHtml("  \n\n "), "");
assert.equal(
	normalizePastedText("• one\r\n◦ two x\r\n— dash\r\n· dot"),
	"- one\n- two x\n- dash\n- dot",
);

// ---------------------------------------------------------------- light variant
// Only bold, italic, links and lists are formatting; everything else stays as typed.
assert.equal(
	inlineMarkdownToHtml("**b** _i_ ~~s~~ `c` @chef", "light"),
	"<strong>b</strong> <em>i</em> ~~s~~ `c` @chef",
);
assert.equal(
	inlineMarkdownToHtml("[guide](https://a.com/x) https://b.com/y", "light"),
	'<a href="https://a.com/x">guide</a> <a href="https://b.com/y">https://b.com/y</a>',
);
assert.deepEqual(
	parseBlocks("# not a heading\n> not a quote\n```\nplain", "light"),
	[
		{
			type: "paragraph",
			lines: ["# not a heading", "> not a quote", "```", "plain"],
		},
	],
);
assert.deepEqual(
	parseBlocks("Mix well\n- salt\n- pepper\n\n1. Bake\n2. Cool", "light"),
	[
		{ type: "paragraph", lines: ["Mix well"] },
		{ type: "list", ordered: false, items: ["salt", "pepper"] },
		{ type: "list", ordered: true, items: ["Bake", "Cool"] },
	],
);
// Old plain-text steps keep their line breaks and are never altered
assert.equal(
	markdownToHtml("Heat the pan.\nAdd oil.\n\nStir for 2 minutes.", "light"),
	"<p>Heat the pan.<br>Add oil.</p><p>Stir for 2 minutes.</p>",
);
assert.equal(
	markdownToHtml("<script>alert(1)</script> **ok**", "light"),
	"<p>&lt;script&gt;alert(1)&lt;/script&gt; <strong>ok</strong></p>",
);

// ---------------------------------------------------------------- plain text (SEO, previews)
assert.equal(
	markdownToPlainText(
		"Mix **well** with [this guide](https://a.com/x).\n\n- salt\n- _fine_ pepper",
	),
	"Mix well with this guide. salt. fine pepper.",
);
assert.equal(
	markdownToPlainText("Cook 5 min\nthen rest"),
	"Cook 5 min then rest",
);
assert.equal(markdownToPlainText(""), "");

console.log("rich text markdown engine: PASS");
