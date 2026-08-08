# Engineering Standards

## Controlled language

This project uses ASD-STE100 controlled technical English.

Write short, direct sentences. Use the same word for the same object. Define a technical term before its first use. Use active voice for instructions. Avoid idioms, metaphors, vague quantity words, and marketing claims.

Do not use an em dash. Use a full stop, a colon, or parentheses when required.

## Product terms

| Term | Meaning |
| --- | --- |
| convergence | Four or more unique, tagged wallets buy one token within 48 hours. |
| signal | A stored convergence result for one token and one time window. |
| verified signal | A signal with a completed GenLayer verification result. |
| wallet action | A normalized buy or sell event from a tracked wallet. |
| performance record | Measured price outcomes for all stored signals. |
| failed signal | A signal that meets the defined loss condition. |

## Claims and metrics

- Include unsuccessful signals in every performance calculation.
- State the time range, data source, sample size, and calculation method for each published metric.
- Label illustrative data as illustrative.
- Do not use historical data as a forecast.
- Preserve source identifiers and verification transaction references where available.

## Code standard

- Use descriptive names.
- Keep functions small and single-purpose.
- Validate external input at the boundary.
- Return explicit errors. Do not hide a failed verification.
- Do not add author names or tool names to source comments.
