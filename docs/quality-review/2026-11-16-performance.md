# Performance implementations — 16 November 2026

Eight independently committed changes address the performance audit. Earlier uncommitted work is excluded from these commits.

## 1. Reuse date/time formatters

A bounded timezone formatter cache replaces per-event formatter construction. History's fallback date lookup now computes only the date key. Locale output, midnight rollover, and DST behavior are preserved. Validation: 27 date/history tests passed.
