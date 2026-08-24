# AI Concepts Question Bank — LLMs, RAG & Agentic AI

ABOUTME: A 60-question MCQ bank testing AI concepts (LLMs, RAG, Agentic AI) grounded in this repo's stack.
ABOUTME: Includes answer key and transferable instructions so any repo can run the same quiz format.

> **Topics:** Large Language Models · Retrieval-Augmented Generation (RAG) · Agentic AI
> **Format:** 60 multiple-choice questions, delivered in 6 batches of 10.
> **Grounding:** Questions reference this repo's stack (Vercel AI SDK, Supabase + pgvector,
> `text-embedding-3-small`, Gemini/GPT model routing, Document Grounded Generation).

---

## How to use this bank

- Work through it **10 at a time**. Answer a batch before revealing the key.
- Each batch builds in difficulty: fundamentals → advanced → synthesis.
- The answer key is at the bottom. Cover it while answering.
- To run this quiz in **another repository**, hand the AI assistant the
  [Transferable Instructions](#transferable-instructions) section below.

---

## Batch 1 — LLM Fundamentals (Q1–10)

**Q1.** Embeddings are generated with OpenAI's `text-embedding-3-small`. What is the primary purpose of an embedding?
- A. To compress a PDF into a smaller file size
- B. To convert text into a numeric vector that captures semantic meaning
- C. To encrypt user messages before storing them in the database
- D. To translate text between languages

**Q2.** What does "LLM" stand for?
- A. Large Language Model
- B. Long Lasting Memory
- C. Linear Learning Machine
- D. Layered Logic Module

**Q3.** A "token" in the context of an LLM most accurately refers to:
- A. An authentication secret like `AUTH_SECRET`
- B. A chunk of text (roughly a word or sub-word) that the model processes
- C. A single character always
- D. A vector embedding

**Q4.** What does a model's **context window** refer to?
- A. The UI panel showing chat history
- B. The maximum amount of text (tokens) the model can consider at once
- C. The time window before a session expires
- D. The number of models available in the selector

**Q5.** What is a **system prompt**?
- A. A prompt written by the end user in the chat box
- B. Instructions that set the model's behavior/role before user messages
- C. An error message from the operating system
- D. The database schema definition

**Q6.** Which of the following is a hallmark of LLM **"hallucination"**?
- A. The model refuses to answer
- B. The model confidently generates plausible but factually incorrect information
- C. The model returns an HTTP 500 error
- D. The model outputs only whitespace

**Q7.** In text generation, the **temperature** parameter primarily controls:
- A. The server's CPU load
- B. The randomness/creativity of the output
- C. The maximum token limit
- D. The embedding dimension size

**Q8.** The main benefit of a multi-provider abstraction SDK (like the Vercel AI SDK) is:
- A. It makes the models run faster on GPUs
- B. It provides a unified interface so you can swap/route between model providers with less code change
- C. It eliminates the need for API keys
- D. It trains the models on your data automatically

**Q9.** What does it mean that chat responses are **"streamed"**?
- A. Video is streamed alongside text
- B. Tokens are sent to the client incrementally as they are generated, rather than all at once
- C. The response is saved to a stream in the database only
- D. Multiple models answer simultaneously

**Q10.** LLMs are fundamentally trained to perform which core task?
- A. Sorting numbers in ascending order
- B. Predicting the next token given the preceding context
- C. Compiling source code
- D. Rendering HTML

---

## Batch 2 — RAG Fundamentals (Q11–20)

**Q11.** What problem does RAG primarily solve?
- A. It speeds up model training
- B. It grounds LLM responses in external/up-to-date documents the model wasn't trained on
- C. It reduces the size of the model weights
- D. It encrypts the vector database

**Q12.** In this repo's RAG flow, what happens **first** when a user submits a query?
- A. The model streams the final answer
- B. The user's message is embedded into a vector
- C. The PDF is uploaded to Vercel Blob
- D. The chat visibility is set to public

**Q13.** The function `match_page_sections` in Supabase performs which operation?
- A. Deletes old chat messages
- B. A similarity search to retrieve the most relevant document chunks for a query
- C. Generates a new embedding model
- D. Renders citations in the UI

**Q14.** Why is **pgvector** used in this architecture?
- A. To store and query high-dimensional embedding vectors efficiently in PostgreSQL
- B. To manage user authentication sessions
- C. To format Tailwind CSS
- D. To compress PDF files

**Q15.** In vector similarity search, two pieces of text are considered "similar" when their embeddings are:
- A. Identical byte-for-byte
- B. Close together in vector space (e.g. high cosine similarity)
- C. The same length in characters
- D. Stored in the same database table

**Q16.** Why are large documents typically split into **chunks** before embedding for RAG?
- A. To make them fit the model's context window and improve retrieval precision
- B. Because embeddings can only handle single words
- C. To translate them into other languages
- D. Chunking is only for image data

**Q17.** In a RAG pipeline, the retrieved document chunks are used to:
- A. Retrain the base model in real time
- B. Augment the prompt as context so the LLM can answer grounded in them
- C. Replace the user's question entirely
- D. Set the temperature parameter

**Q18.** A key advantage of RAG over **fine-tuning** for keeping guidelines current is:
- A. RAG requires no database
- B. You can update the knowledge by changing documents, without retraining the model
- C. RAG makes the model smaller
- D. RAG removes the need for a system prompt

**Q19.** A **Citations Bar** that links answers to sources most directly supports which RAG best practice?
- A. Hiding the model's sources from users
- B. Attributing answers to their source documents for transparency/verifiability
- C. Increasing the temperature
- D. Caching embeddings

**Q20.** Which is a common failure mode of RAG systems?
- A. The model always refuses to answer
- B. Retrieval returns irrelevant chunks, causing a poorly grounded or wrong answer
- C. Embeddings cannot be stored in a database
- D. Streaming is disabled automatically

---

## Batch 3 — RAG & Embeddings, Advanced (Q21–30)

**Q21.** `text-embedding-3-small` produces a fixed-length vector. The number of values in that vector is called the:
- A. Token count
- B. Dimensionality of the embedding
- C. Temperature
- D. Batch size

**Q22.** **Cosine similarity** measures similarity between two vectors based on:
- A. The angle between them (regardless of magnitude)
- B. The number of shared characters
- C. Their file sizes
- D. Their creation timestamps

**Q23.** In RAG, "**top-k retrieval**" refers to:
- A. Selecting the k most similar chunks to include as context
- B. Training for k epochs
- C. Limiting the answer to k tokens
- D. Keeping only k users online

**Q24.** A **hybrid search** approach in RAG typically combines:
- A. Two different LLMs
- B. Semantic (vector) search with keyword/lexical search
- C. Two databases in different regions
- D. Streaming and non-streaming responses

**Q25.** If chunks are made **too large**, a likely downside is:
- A. Retrieval becomes less precise and irrelevant text dilutes the context
- B. Embeddings become impossible to compute
- C. The database refuses to store them
- D. Cosine similarity always returns zero

**Q26.** **Chunk overlap** (letting consecutive chunks share some text) is used to:
- A. Avoid splitting a relevant idea awkwardly across a boundary and losing context
- B. Double the storage cost intentionally
- C. Encrypt the chunks
- D. Increase the temperature

**Q27.** Why must the **same embedding model** be used for both indexing documents and embedding the query?
- A. Otherwise the vectors live in different/incompatible spaces and similarity is meaningless
- B. Because the database only supports one model
- C. To save API costs
- D. It doesn't matter; any model works

**Q28.** A **re-ranker** in a RAG pipeline is used to:
- A. Reorder the initially retrieved candidates by relevance, often with a more precise model
- B. Randomly shuffle results
- C. Delete the vector index
- D. Generate embeddings faster

**Q29.** A trade-off of stuffing full documents into context (long-context) vs. RAG is:
- A. Long context can be simpler but costs more tokens and may hit context limits on large corpora
- B. Long context never works
- C. RAG cannot cite sources but long context always can
- D. Long context requires no model at all

**Q30.** Which metric describes retrieval that returns **all** the relevant chunks that exist (not missing any)?
- A. Recall
- B. Temperature
- C. Latency
- D. Dimensionality

---

## Batch 4 — Agentic AI Fundamentals (Q31–40)

**Q31.** What most fundamentally distinguishes an **AI agent** from a plain single-shot LLM call?
- A. An agent can take actions, use tools, and loop based on results to pursue a goal
- B. An agent always uses a bigger model
- C. An agent never uses an LLM
- D. An agent only works offline

**Q32.** In agentic systems, **"tool use"** (a.k.a. function calling) means:
- A. The LLM decides to invoke external functions/APIs and uses their results
- B. The user manually edits the database
- C. The model compiles code into binaries
- D. The IDE runs a linter

**Q33.** The **ReAct** pattern in agents stands for the interleaving of:
- A. Reasoning and Acting
- B. Reading and Caching
- C. Retrieval and Attention
- D. Rendering and Compiling

**Q34.** In tool/function calling, whose job is it to **decide which tool to call and with what arguments**?
- A. The LLM, based on the tool schemas provided
- B. The PostgreSQL database
- C. The end user, always manually
- D. The CSS framework

**Q35.** An **agent loop** typically continues until:
- A. A stopping condition is met (goal achieved, max steps, or a final answer produced)
- B. The user closes the browser only
- C. Exactly one token is generated
- D. The temperature reaches zero

**Q36.** Why do tools/functions given to an LLM need a **schema** (name, description, parameters)?
- A. So the model knows what each tool does and how to format valid calls to it
- B. To encrypt the tool
- C. To make the tool run faster
- D. Schemas are purely decorative

**Q37.** A major **risk** of giving an agent tools that take real actions (e.g. delete records, send emails) is:
- A. The agent may take unintended or harmful actions, so guardrails/approvals are needed
- B. The tools will always run twice
- C. Tool use disables streaming
- D. It reduces the context window to zero

**Q38.** **"Human-in-the-loop"** in agentic systems refers to:
- A. Requiring human review/approval before certain agent actions execute
- B. A human writing all the code
- C. Disabling the LLM entirely
- D. Streaming responses to multiple humans

**Q39.** Which of these is an example of an agent using **memory**?
- A. Persisting facts/state across steps or sessions to inform later decisions
- B. Increasing the model's parameter count
- C. Deleting all prior context every token
- D. Storing PDFs in Blob storage only

**Q40.** **Multi-agent** systems (e.g. a planner agent + worker sub-agents) are typically used to:
- A. Decompose complex tasks and let specialized agents handle sub-parts
- B. Guarantee lower cost than a single call always
- C. Avoid using any LLM
- D. Replace the need for tools entirely

---

## Batch 5 — Agentic AI, Advanced Patterns & Orchestration (Q41–50)

**Q41.** In an agentic RAG system, what makes it "agentic" compared to standard RAG?
- A. The agent can decide *whether* to retrieve, *what* to query, and iterate on retrieval based on results
- B. It uses a larger embedding model
- C. It disables citations
- D. It stores vectors in Blob storage

**Q42.** The **"orchestrator-worker"** (planner-executor) pattern involves:
- A. A lead agent breaking a task into subtasks delegated to worker agents, then synthesizing results
- B. One model generating a single token
- C. Running the database migrations
- D. Rendering the sidebar

**Q43.** **Prompt chaining** refers to:
- A. Decomposing a task into a sequence of steps where each LLM output feeds the next
- B. Encrypting prompts in a chain
- C. Chaining multiple GPUs together
- D. Linking database foreign keys

**Q44.** A **"reflection"** (self-critique) step in an agent workflow is used to:
- A. Have the model evaluate and improve its own output before finalizing
- B. Mirror the UI to another screen
- C. Reduce the embedding dimension
- D. Reflect light in a diagram

**Q45.** What is a **"tool call / infinite loop"** risk in tool-calling agents?
- A. The agent repeatedly calls tools without converging on a final answer, wasting tokens/cost
- B. The database connection closes
- C. The embeddings become negative
- D. Streaming stops working

**Q46.** The **"routing"** pattern (relevant to this repo's model selection) means:
- A. Classifying the input and directing it to the most appropriate model/prompt/tool path
- B. Configuring network routes
- C. Routing HTTP requests to a CDN
- D. Sorting the vector index

**Q47.** Why is **structured output** (e.g. JSON schema-constrained responses) important for agents?
- A. It makes the LLM's output reliably parseable by downstream code/tools
- B. It increases the temperature
- C. It hides the answer from the user
- D. It compresses the model

**Q48.** **Guardrails** in an agentic system typically refer to:
- A. Constraints/validation that keep agent behavior safe and within allowed bounds
- B. UI scrollbars
- C. Physical server racks
- D. The git branch protection rules

**Q49.** The **"evaluator-optimizer"** loop pattern works by:
- A. One LLM generates a response, another evaluates it and gives feedback, and the generator revises — iterating until it passes
- B. Two databases syncing
- C. Optimizing SQL query plans
- D. Compressing images

**Q50.** A key reason to prefer **simple, composable patterns** over a fully autonomous agent is:
- A. Predictability, lower cost, and easier debugging — autonomy adds complexity and risk
- B. Autonomous agents can't use tools
- C. Simple patterns don't need an LLM
- D. Composability is impossible with LLMs

---

## Batch 6 — Mixed Synthesis: LLMs + RAG + Agentic AI (Q51–60)

**Q51.** An "agentic RAG" system answering a guideline question might, in order:
- A. Delete the vector index, then answer
- B. Set temperature to zero, then stop
- C. Decide to retrieve → embed & search → (optionally re-rank) → augment prompt → generate a cited answer
- D. Render the sidebar, then log out

**Q52.** Which statement about **fine-tuning vs. RAG vs. prompting** is correct?
- A. Prompting changes the model's weights permanently
- B. RAG injects external knowledge at inference time; fine-tuning changes model weights via training
- C. Fine-tuning requires no data
- D. RAG and fine-tuning are the same thing

**Q53.** An LLM returns a confident but wrong answer about a guideline. The **best RAG-based mitigation** is:
- A. Increase the temperature
- B. Remove the system prompt
- C. Ground responses in retrieved source documents and show citations
- D. Switch to a smaller model

**Q54.** Why does model **routing** (Gemini vs GPT, RAG vs long-context) exist in this repo?
- A. Different models/strategies suit different needs (web grounding, long PDFs, or vector RAG)
- B. To make the code longer
- C. Because only one model actually works
- D. To avoid using embeddings entirely

**Q55.** A prompt injection attack against an agentic/RAG app typically tries to:
- A. Smuggle malicious instructions via user input or retrieved content to hijack the model's behavior
- B. Overheat the GPU
- C. Delete the CSS files
- D. Increase embedding dimensions

**Q56.** Which is the **correct ordering** of a standard RAG indexing pipeline (offline)?
- A. Generate answer → retrieve → embed → chunk
- B. Load documents → chunk → embed chunks → store vectors in the index
- C. Store vectors → chunk → load documents → embed
- D. Embed query → answer → chunk → store

**Q57.** "**Context window management**" matters in agent loops because:
- A. Long histories and tool outputs can exceed the window, so older/irrelevant content must be summarized or pruned
- B. The window is infinite, so it never matters
- C. Larger windows always reduce cost
- D. It only affects images

**Q58.** Which best describes a good use of **structured (JSON) output** in this chatbot?
- A. Returning citations/source metadata in a parseable form for the Citations Bar
- B. Encrypting the user's password
- C. Compressing the PDF
- D. Rendering Tailwind classes

**Q59.** When would **long-context (full PDF in prompt)** be *preferable* to RAG?
- A. Never — RAG is always better
- B. When the relevant corpus is small enough to fit in context and you want to avoid retrieval errors
- C. Only when the database is offline
- D. When you want to reduce token usage to zero

**Q60.** The single most important reason to **cite sources** in a government guidelines chatbot is:
- A. To make responses longer
- B. To increase temperature
- C. Trust, verifiability, and accountability — users can confirm answers against official documents
- D. To hide which model was used

---

## Answer Key

| Q | Ans | Q | Ans | Q | Ans | Q | Ans | Q | Ans | Q | Ans |
|---|-----|---|-----|---|-----|---|-----|---|-----|---|-----|
| 1 | B | 11 | B | 21 | B | 31 | A | 41 | A | 51 | C |
| 2 | A | 12 | B | 22 | A | 32 | A | 42 | A | 52 | B |
| 3 | B | 13 | B | 23 | A | 33 | A | 43 | A | 53 | C |
| 4 | B | 14 | A | 24 | B | 34 | A | 44 | A | 54 | A |
| 5 | B | 15 | B | 25 | A | 35 | A | 45 | A | 55 | A |
| 6 | B | 16 | A | 26 | A | 36 | A | 46 | A | 56 | B |
| 7 | B | 17 | B | 27 | A | 37 | A | 47 | A | 57 | A |
| 8 | B | 18 | B | 28 | A | 38 | A | 48 | A | 58 | A |
| 9 | B | 19 | B | 29 | A | 39 | A | 49 | A | 59 | B |
| 10 | B | 20 | B | 30 | A | 40 | A | 50 | A | 60 | C |

---

## Transferable Instructions

Copy the block below and give it to an AI coding assistant in **any** repository to
generate and administer a similar quiz tailored to that repo.

> **PROMPT — AI Concepts Quiz Generator (repo-grounded)**
>
> Act as an examiner. Create a **60-question multiple-choice quiz** testing my
> understanding of the AI concepts used in *this* repository. Cover three areas
> evenly (20 questions each), scaling difficulty from fundamentals to synthesis:
> 1. **LLM fundamentals** (tokens, context windows, embeddings, temperature,
>    system prompts, streaming, hallucination, next-token prediction)
> 2. **RAG** (chunking, embeddings, vector similarity, top-k retrieval, re-ranking,
>    hybrid search, citations, RAG vs fine-tuning vs long-context)
> 3. **Agentic AI** (tool/function calling, agent loops, ReAct, routing, reflection,
>    orchestrator-worker, guardrails, human-in-the-loop, memory, multi-agent)
>
> **Grounding requirement:** Inspect this repo's actual stack (model providers,
> vector store, embedding model, agent/tool code, prompt files) and phrase questions
> so they reference the real technologies found here. If a concept isn't present in
> the repo, still include it but frame it generically.
>
> **Rules:**
> - Each question has exactly 4 options (A–D) with one correct answer.
> - **Shuffle the correct-answer position** across A/B/C/D — do not let a single
>   letter dominate.
> - Deliver the quiz **10 questions at a time**. After I answer a batch, grade it,
>   report a running score, briefly explain any wrong answers, then continue.
> - Keep an answer key but do **not** reveal it until I've answered each batch.
> - When I ask "how does X actually work," pause the quiz and teach the concept
>   clearly with analogies before resuming.
> - At the end, give a final score out of 60 and a short breakdown by topic.
> - Optionally, save the full question set + answer key + these instructions to a
>   markdown file so I can grow a reusable question bank.
