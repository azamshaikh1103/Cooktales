import assert from "node:assert/strict";
import {
	inlineMarkdownToHtml,
	markdownToHtml,
	normalizePastedText,
	parseBlocks,
	tokenizeInline,
} from "./discussionMarkdown";

// Inline formatting
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

// Blocks
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
// Unclosed fence swallows the rest instead of looping
assert.deepEqual(parseBlocks("```\nabc"), [{ type: "code", text: "abc" }]);
// Markdown inside code is not formatted
assert.equal(
	markdownToHtml("```\n**not bold**\n```"),
	"<pre><code>**not bold**</code></pre>",
);
// Single newline = soft break inside one paragraph
assert.equal(markdownToHtml("a\nb"), "<p>a<br>b</p>");
// Empty input produces no HTML (so the placeholder shows)
assert.equal(markdownToHtml("  \n\n "), "");

// Pasted text clean-up
assert.equal(
	normalizePastedText("• one\r\n◦ two x\r\n— dash"),
	"- one\n- two x\n- dash",
);

console.log("discussion markdown engine: PASS");
