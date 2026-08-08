# Contribution Guide

## Writing standard

Use ASD-STE100 controlled technical English in source comments, documentation, issue text, pull requests, and release notes.

- Use short sentences.
- Use one instruction per sentence.
- Use approved, simple words where possible.
- Use active voice.
- Use a consistent term for one concept.
- Do not use an em dash.
- Do not make a claim that cannot be verified.
- State limits, assumptions, and failures clearly.

Use the terms in `docs/engineering-standards.md`.

## Commit messages

Use Conventional Commits. Write the subject in the imperative form. Keep the subject at 72 characters or fewer. Do not end the subject with punctuation.

Examples:

```text
feat(api): add token signal endpoint
fix(payment): reject expired authorization
docs: define signal performance metrics
test(contract): cover missing signal result
```

Use a body when the change needs context. State what changed and why. Do not add automated-author attribution to source files, commits, pull requests, or release notes.

## Decision records

Store working decision records in `.local/decisions/`. Git ignores this directory. Use the template in `docs/decision-record-template.md`.

Move a decision into `docs/` only when the team approves it for project history.
