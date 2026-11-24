# Recall product context

Recall is a Korean local-first memory retrieval evaluation studio for developers and portfolio reviewers. The primary task is to compare three strategies on exactly the same conversation and inspect evidence behind successes and failures.

The user requested a polished working implementation, tests, and a portfolio-ready README. They clarified that “latest AI UI implementation methods” meant skills and agent workflows for creating interfaces, rather than simply copying AI products' visual layouts.

Product truth: 8 synthetic conversations, 96 memories, 48 diagnostic probes, 3 retrieval strategies. There is no LLM generation, semantic embedding model, external API, authentication, billing, or server-side storage. Correction metadata is explicitly authored. The app measures retrieval quality, not answer correctness. Results are ephemeral unless exported.

Primary audience: Korean-speaking developers learning or demonstrating retrieval evaluation. The interface should make evidence inspection easy without requiring the visitor to understand the implementation first. The Methods page and README carry technical definitions and limitations.

Success: run or adjust an experiment, find a contrasting case, inspect the source, understand a limitation, export a reproducible result. Never trade truthful metrics for impressive-looking numbers.
