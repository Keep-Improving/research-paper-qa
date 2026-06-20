# 科研文献问答库公共同步版 PRD

日期：2026-06-20

## 1. 背景

当前原型已经具备网站页面、Chrome 插件侧边栏、选中文本创建锚点、插件本地提交问题、网站样例页面等基础能力。但经过实际检查后，系统还没有成为一个真正可供外部用户使用的同步工具：

- 插件问题写入 `chrome.storage.local`，网站读取 `sampleData.ts`，两边不是同一数据源。
- 网站页面大量使用静态样例数据，不能采集真实用户问题、回答、评论和反馈。
- 网站多个按钮可见但无实际效果，例如收藏、关注、审核处理、作者回应入口。
- 插件能展示问题列表，但问题卡片不能进入详情，也不能回答、评论、投票或举报。
- 作者认证、收藏、治理、通知等页面目前偏展示，不具备公共服务上的真实持久化状态。

本 PRD 的目标是把项目从“演示原型”推进到“公共服务器可用版本”：网站和插件连接同一个后端 API 与数据库，真实保存用户需求和反馈，让外部用户能够通过网站或插件围绕文献提出问题、互动和沉淀讨论。

## 2. 产品目标

### 2.1 核心目标

1. 网站和插件使用同一套公共 API 和数据库。
2. 插件中提交的问题、回答、评论、投票和收藏，能在网站中同步看到。
3. 网站中提交的问题、回答、评论、投票和收藏，能在插件中同步看到。
4. 用户能够围绕某篇文献和某个引用锚点进行真实讨论。
5. 系统能部署到公共 HTTPS 服务，供外部用户访问并采集真实反馈。
6. AI API 不是必选项，第一阶段不依赖 AI 才能完成核心流程。

### 2.2 第一阶段成功标准

- 外部用户打开网站可以搜索、浏览、收藏文献和讨论。
- 外部用户安装插件后，可以在论文页面打开侧边栏，看到该文献的真实讨论。
- 用户在插件里选中文本并提交问题后，网站论文页和讨论详情页都能显示该问题。
- 用户可以在网站或插件中打开问题详情，进行回答、评论、投票和举报。
- 网站和插件都能处理加载、空数据、失败和未登录状态。

## 3. 非目标

第一阶段暂不做以下内容：

- 不要求接入 AI API。相似问题、语义锚点和摘要可以先预留接口，暂不作为必需能力。
- 不做复杂声誉系统和积分系统。
- 不做复杂组织/机构权限管理。
- 不做 Zotero、Obsidian、Notion 等第三方插件。
- 不做大规模内容删除或批量删除功能。
- 不把 AI 判断作为自动删除、自动发布或自动定性争议的依据。

## 4. 当前问题与必须解决方式

| 编号 | 当前问题 | 必须解决方式 | 状态 |
|---|---|---|---|
| P0-1 | 插件和网站不同步 | 插件与网站都改为调用同一公共 API | pending |
| P0-2 | 网站使用 `sampleData.ts` 静态数据 | 改为从 Postgres 读取真实数据，样例数据只作为 seed | pending |
| P0-3 | 插件问题只存在 `chrome.storage.local` | 改为 POST 到公共 API；本地存储只允许做临时草稿或失败重试队列 | pending |
| P0-4 | 插件列表卡片不能点进详情 | 插件增加讨论详情视图 | pending |
| P0-5 | 插件不能互动 | 插件增加回答、评论、投票、举报入口 | pending |
| P0-6 | 网站收藏、关注按钮无效 | 接入收藏/关注 API，并在 UI 中显示状态变化 | pending |
| P0-7 | 网站治理按钮无效 | 接入 moderation API，支持隐藏、恢复、标记争议、关联重复 | pending |
| P0-8 | 作者工作台按钮无效 | 接入作者回应 API，并按作者认证权限控制入口 | pending |
| P0-9 | 作者认证只在页面内临时展示 | 接入数据库和审核状态 | pending |
| P0-10 | 搜索只搜静态样例 | 接入数据库搜索；后续可升级全文搜索 | pending |

## 5. 推荐技术架构

### 5.1 总体架构

- Web/API：Next.js
- 数据库：Postgres
- ORM：Prisma
- 部署：Vercel 或等价 Node/Next 公共服务
- 数据库托管：Neon Postgres、Supabase Postgres 或等价服务
- 插件：Chrome Manifest V3，调用公共 HTTPS API
- AI：可选后续模块，不阻塞核心流程

### 5.2 数据流

1. 插件 content script 识别当前文献和用户选区。
2. 插件 side panel 调用公共 API 匹配或创建 paper。
3. 用户在插件提交问题时，API 创建 anchor 和 discussion。
4. 网站论文页通过同一 API 读取 paper、anchor、discussion。
5. 网站或插件中的回答、评论、投票、举报都写入同一数据库。
6. 所有客户端重新拉取后看到一致状态。

### 5.3 本地开发与公共部署

- 本地开发使用 `.env` 中的 `DATABASE_URL`。
- 公共部署使用 Vercel 环境变量中的 `DATABASE_URL`。
- Prisma migration 管理 schema 变更。
- seed 脚本只用于初始化演示数据，不作为运行时数据源。

## 6. 数据模型

### 6.1 User

保存用户账号基础信息。第一阶段可以用轻量身份方案：

- `id`
- `displayName`
- `email`
- `role`
- `createdAt`
- `updatedAt`

如果暂时没有完整登录系统，可以使用开发期 header 或匿名会话标识，但 API 设计必须保留用户字段，避免后续重构。

### 6.2 Paper

- `id`
- `title`
- `doi`
- `arxivId`
- `pmid`
- `url`
- `authors`
- `venue`
- `year`
- `abstract`
- `createdAt`
- `updatedAt`

匹配优先级：DOI > arXiv ID > PMID > URL > title。

### 6.3 Anchor

- `id`
- `paperId`
- `kind`: `paper | text | image | screenshot | figure | table | formula | reference | manual`
- `quoteText`
- `contextText`
- `sectionLabel`
- `pageNumber`
- `sourceUrl`
- `domPath`
- `imageUrl`
- `note`
- `createdByUserId`
- `createdAt`
- `updatedAt`

### 6.4 Discussion

用于问题主帖。

- `id`
- `paperId`
- `anchorId`
- `title`
- `body`
- `status`: `open | answered | resolved | author_responded | disputed | hidden`
- `authorUserId`
- `isHidden`
- `createdAt`
- `updatedAt`

### 6.5 DiscussionReply

用于回答、评论、作者回应和补充说明。

- `id`
- `discussionId`
- `parentReplyId`
- `kind`: `answer | comment | author_response | correction | replication_note`
- `body`
- `authorUserId`
- `isAuthorResponse`
- `isHidden`
- `createdAt`
- `updatedAt`

### 6.6 Vote

- `id`
- `targetType`: `discussion | reply`
- `targetId`
- `userId`
- `value`: `up | down | helpful`
- `createdAt`

同一用户对同一目标同一投票类型只能有一条有效记录。

### 6.7 CollectionItem

- `id`
- `userId`
- `targetType`: `paper | discussion | anchor`
- `targetId`
- `note`
- `createdAt`

### 6.8 PaperAuthorClaim

- `id`
- `paperId`
- `userId`
- `claimedRole`: `first_author | corresponding_author | co_author`
- `evidenceType`
- `evidenceDetail`
- `status`: `pending | approved | rejected`
- `reviewedByUserId`
- `createdAt`
- `updatedAt`

只有 `approved` 的 `first_author` 和 `corresponding_author` 可以发布 `author_response`。

### 6.9 ModerationReport

- `id`
- `targetType`
- `targetId`
- `reporterUserId`
- `reason`
- `status`: `open | resolved | dismissed`
- `action`: `none | hidden | restored | disputed | duplicate_linked`
- `createdAt`
- `updatedAt`

## 7. API 需求

### 7.1 Paper API

- `GET /api/papers?query=...`
- `GET /api/papers/:paperId`
- `POST /api/papers/match`

`POST /api/papers/match` 用于插件根据 DOI、arXiv ID、PMID、URL 或 title 匹配/创建文献。

### 7.2 Discussion API

- `GET /api/papers/:paperId/discussions`
- `POST /api/papers/:paperId/discussions`
- `GET /api/discussions/:discussionId`
- `PATCH /api/discussions/:discussionId`

创建问题时可以同时传入 anchor 数据。后端负责创建或复用 anchor。

### 7.3 Reply API

- `POST /api/discussions/:discussionId/replies`
- `PATCH /api/replies/:replyId`

普通用户可创建 `answer` 或 `comment`。只有有权限的作者用户能创建 `author_response`。

### 7.4 Vote API

- `POST /api/votes`
- `DELETE /api/votes/:voteId`

用于讨论和回复的赞同、反对、有帮助反馈。

### 7.5 Collection API

- `GET /api/me/collections`
- `POST /api/collections`
- `DELETE /api/collections/:collectionItemId`

网站收藏按钮和插件收藏按钮都必须走该 API。

### 7.6 Author Claim API

- `GET /api/me/author-claims`
- `POST /api/author-claims`
- `PATCH /api/author-claims/:claimId`

第一阶段可允许管理员通过 API 或后台页面审批。

### 7.7 Moderation API

- `POST /api/reports`
- `GET /api/moderation/reports`
- `POST /api/moderation/actions`

治理动作必须可逆，不提供批量删除。

## 8. 网站功能需求

### 8.1 首页/搜索

- 搜索真实数据库中的 papers、discussions、anchors。
- 支持空状态和错误状态。
- 搜索结果链接到真实详情页。

### 8.2 文献详情页

- 展示真实 paper metadata。
- 展示该 paper 的真实 discussion 列表。
- 支持筛选：全部、作者回应、未回答、争议中。
- 支持排序：最新、热度。
- `Add to collection` 必须更新收藏状态。
- `Follow paper` 第一阶段可并入收藏或单独记录关注状态，但必须有真实状态变化。

### 8.3 讨论详情页

- 展示问题、引用锚点、回答、评论、作者回应。
- 支持提交回答。
- 支持提交评论。
- 支持投票。
- 支持举报。
- 有权限作者可发布作者回应。

### 8.4 锚点详情页

- 展示 quote、context、位置、图片或手动说明。
- 展示相关 discussions。
- 支持按相同 paper 与 anchor 信息检索相关讨论。

### 8.5 收藏页

- 展示真实收藏的 papers、discussions、anchors。
- 支持取消收藏。

### 8.6 作者认证页

- 提交认证申请后写入数据库。
- 显示当前用户申请状态。

### 8.7 作者工作台

- 只展示当前用户有作者回应权限的 paper。
- 展示高热、未回答、被提及锚点的问题。
- 有权限时提供作者回应入口。
- 无权限时只允许普通回答或提问。

### 8.8 治理后台

- 展示真实举报队列。
- 支持隐藏、恢复、标记争议、关联重复。
- 不提供删除或批量删除入口。

## 9. 插件功能需求

### 9.1 文献识别和匹配

- content script 识别 DOI、arXiv ID、PMID、URL、title。
- side panel 打开后调用 `POST /api/papers/match`。
- 匹配失败时提供手动 paper 信息输入。

### 9.2 讨论列表

- 插件从 `GET /api/papers/:paperId/discussions` 获取真实讨论。
- 支持筛选和排序。
- 不再把正式问题只存 `chrome.storage.local`。

### 9.3 提问

- `Use selection` 生成 text anchor。
- 手动 anchor 和图片 anchor 也能作为 anchor draft。
- 提交问题调用 API。
- 提交成功后刷新列表，并在网站可见。
- 提交失败时保留草稿，并显示错误。

### 9.4 讨论详情与互动

插件列表卡片必须可点击进入详情视图。详情视图支持：

- 返回列表。
- 查看问题正文和 anchor。
- 查看回答、评论、作者回应。
- 添加回答。
- 添加评论。
- 投票。
- 举报。
- 打开网站详情页。

### 9.5 插件本地存储边界

`chrome.storage.local` 只允许用于：

- API base URL 设置。
- 未提交草稿。
- 网络失败的临时重试队列。
- 用户 UI 偏好。

正式讨论数据必须以数据库为准。

## 10. 权限规则

第一阶段可使用简化登录/用户模型，但必须保留以下业务规则：

- 未登录或匿名用户：可浏览公开内容；是否允许提交由配置决定。
- 普通用户：可提问、回答、评论、投票、收藏、举报。
- 认证科研用户：有认证标识，但不自动拥有作者回应权限。
- 本文 co-author：可显示作者身份，但默认不能发布作者回应。
- 本文 first author / corresponding author：可选择发布作者回应。
- 作者也可以以普通用户身份提问、回答、评论；这些内容不自动带作者回应标签。
- 管理员：可处理举报、隐藏、恢复、标记争议、关联重复。

## 11. 部署需求

### 11.1 公共服务

- 网站和 API 必须部署到公共 HTTPS 域名。
- 插件配置中必须支持设置或内置 API base URL。
- 插件 manifest 权限必须允许访问该 API 域名。

### 11.2 数据库

- 使用 Postgres。
- 使用 Prisma migrations。
- 提供 seed 脚本初始化少量 paper/discussion 数据，方便演示和测试。

### 11.3 环境变量

至少需要：

- `DATABASE_URL`
- `NEXT_PUBLIC_API_BASE_URL` 或插件构建时配置项
- 后续认证相关 secret

## 12. 测试与验收

### 12.1 自动化测试

- Prisma/model 层测试：paper match、discussion create、reply create、vote、collection、author claim、moderation。
- Web API 测试：所有核心 API 的成功、失败、权限路径。
- Web Playwright 测试：搜索、文献详情、讨论详情、收藏、作者认证、作者工作台、治理后台。
- Extension Vitest 测试：API client、paper matching、selection anchor、sidebar list/detail/action flows。
- Extension browser smoke：插件提交问题后，网站同 paper 页面能看到该问题。

### 12.2 手动验收

1. 在公共网站创建或打开一篇文献。
2. 在插件中打开同一文献页面。
3. 选中文本并提交问题。
4. 网站文献页无需手动改数据即可看到该问题。
5. 在网站中回答该问题。
6. 插件刷新后能看到该回答。
7. 在插件中评论和投票。
8. 网站讨论详情页能看到评论和投票变化。
9. 有权限作者能发布作者回应。
10. 普通用户不能发布作者回应标签。

## 13. 分阶段里程碑

### M1：共享数据层和 API

- Prisma schema
- Postgres 连接
- paper/discussion/anchor/reply/vote/collection 基础 API
- seed 数据
- 状态：pending

### M2：网站接入真实数据

- 首页搜索接 API
- 文献详情接 API
- 讨论详情接 API
- 收藏、回答、评论、投票接 API
- 移除运行时对 `sampleData.ts` 的依赖
- 状态：pending

### M3：插件接入公共 API

- 插件 API client
- paper match
- discussion list
- create question
- discussion detail
- answer/comment/vote/report
- API base URL 配置
- 状态：pending

### M4：作者认证和作者回应

- author claim 持久化
- 权限判断
- 作者工作台接 API
- 作者回应发布
- 状态：pending

### M5：治理和公共部署

- moderation API
- moderation UI 接 API
- Vercel/Postgres 部署文档
- 插件连接公共 API 的打包配置
- 状态：pending

## 14. 风险与约束

- 真实公共服务器需要数据库凭证和部署账号；没有凭证时只能完成本地真实 API 和部署文档。
- 浏览器插件跨域访问公共 API 需要正确配置 CORS 和 host permissions。
- 若暂不做完整登录，用户身份必须先用可替换的简化方案实现，避免后续权限逻辑推倒重写。
- Postgres 部署后需要 migration 管理，不能继续依赖静态 TS 数据。
- 插件离线草稿和服务端最终状态可能冲突，需要明确“服务端为准”。

## 15. PRD 完成状态

- 当前问题清单：complete
- 目标架构：complete
- 数据模型：complete
- API 范围：complete
- 网站功能要求：complete
- 插件功能要求：complete
- 测试验收标准：complete
- 代码实现：pending
- 公共部署：pending

## 16. 下一步建议

按照本 PRD 改代码前，建议进一步细化每个任务的内容和代码架构设计，保证目标实现，各部分之间逻辑完整、链接而不冲突，并把实现细节拆到可执行任务级别。

## 17. Implementation Status Update - 2026-06-20

- M1 shared data/API layer: partial. Prisma schema/seed exists; Next.js API routes now cover paper matching, paper discussions, discussion detail, replies, votes, collections, and moderation reports.
- M2 website real-data wiring: partial. Paper detail and discussion detail pages now read Prisma-backed data and use real API-backed controls for collection, reply, vote, and report. Other pages still need migration from runtime sample data.
- M3 extension real sync: partial. Sidebar now uses the public API for paper match, discussion list, question create, reply, vote, and report. `chrome.storage.local` is no longer the formal discussion source. 2026-06-20 follow-up: fixed recovery after an initial API 500 so question submission re-matches the remote paper and posts to the real paper ID instead of the local fallback ID.
- P0-1 / P0-3 / P0-4 / P0-5: partial. Core API sync path and extension detail interactions are implemented; public deployed server verification remains pending.
- P0-2 / P0-6 / P0-7: partial. Core paper/discussion pages and basic buttons are connected; search, moderation UI, collections page, author pages, and full status UI still need migration.
- Browser smoke status: partial. Local Prisma dev Postgres is running, `.env` has `DATABASE_URL`, the Next.js dev API returns real paper/discussion data, and the unpacked extension was rebuilt/reloaded. Remaining web Playwright failures are stale assertions expecting old sample UI copy, not the earlier Prisma `DATABASE_URL` 500.

## 18. Implementation Status Update - 2026-06-20 Sync Detail Fix

- M2 website real-data wiring: improved. Home/search now reads Prisma-backed papers and discussions instead of runtime sample discussions, so API-created questions appear in search results and paper detail lists.
- M2 discussion detail: improved. Discussion anchor title is rendered with the quote/context/image, and author-response discussions show an explicit author response note in lists.
- M3 extension detail sync: improved. Sidebar question cards now have an explicit `Open` action that loads `/api/discussions/:discussionId`; the detail view renders answers, comments, and author responses from the shared API.
- M3 extension reply sync: improved. After submitting an answer/comment in the sidebar, the extension re-fetches discussion detail so newly posted replies and existing replies stay visible.
- P0-1 / P0-2 / P0-4 / P0-5 / P0-10: local implementation verified. Browser smoke created a real discussion through the shared API and confirmed it appears on search, paper detail, and discussion detail pages with its reply.
- Remaining: public HTTPS deployment verification, full collections page migration, author-claim workflow completion, moderation action UI completion, and production API base URL packaging for the extension.

## 19. Implementation Status Update - 2026-06-20 Response Navigation Fix

- Discussion detail: improved. Answers and comments are now merged into one chronological `Responses` section with response type labels.
- Reply threading: improved. Each response exposes an inline `Reply to response` form that posts `parentReplyId` through the existing reply API, and nested replies render under their parent response.
- Detail navigation: improved. Fixed sample-style top navigation labels by replacing fixed `Paper detail`, `Question detail`, and `Anchor detail` links with real browse entry points for papers, questions, and anchors. Discussion and anchor detail pages now include `Back to paper` and browse links.
- Anchor detail: improved. Anchor detail now reads Prisma-backed anchors, paper metadata, and related discussions instead of runtime sample data.
- Collections: improved. Collections now reads the current user's real collection items and displays `Saved papers`, `Saved questions`, and `Saved anchors`; seed data initializes one real item of each type for local testing.
- Verification: Playwright covers merged responses, reply form expansion, real anchor detail, navigation links, and `Saved questions`; browser smoke confirmed a nested reply POST returns 201 and renders after reload.

## 20. Implementation Status Update - 2026-06-20 Browse and Thread Clarity Fix

- Response form: improved. Ordinary users no longer choose between `answer` and `comment`; the UI exposes one `Response` concept and posts a standard response through the existing reply API.
- Thread clarity: improved. Nested responses now show `Replying to <author>` metadata so readers can see who is responding to whom.
- Thread depth: improved. Response rendering is capped to two visible levels; deeper replies are flattened into the second level while preserving their `Replying to <author>` context.
- Browse pages: improved. `Papers`, `Questions`, and `Anchors` are now separate routes with focused lists instead of aliases of the generic search page.
- Verification: Playwright covers unified response forms and separate browse pages; web and extension builds/tests pass locally.
