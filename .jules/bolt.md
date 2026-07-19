## 2026-07-19 - Fast Single Regex Matching

**Learning:** When optimizing multiple regex calls over an array into a single combined regex, attempting to use unanchored lookaheads to enforce precedence order (`(?=.*?(?<type1>...))|(?=.*?(?<type2>...))`) causes catastrophic backtracking (O(N^2) time) if the string does not contain the target keywords. A standard combination (`(?<type1>...)|(?<type2>...)`) resolves in O(N) but alters matching logic from sequential precedence to left-to-right positional priority.

**Action:** When a fallback default exists and strict cross-string precedence is explicitly dropped in favor of raw performance, build a single compiled regex using `Object.entries(keywords).map(([type, kw]) => '(?<' + type + '>' + kw.join('|') + ')').join('|')`. To dynamically map the matched groups back to types, extract the keys using `Object.keys()` over the keywords configuration and iterate them inside the `exec` callback instead of hardcoding.
