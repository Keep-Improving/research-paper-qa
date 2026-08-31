import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type SidebarLocale = "zh-CN" | "en-US";

const LOCALE_STORAGE_KEY = "paperqa:locale";

const enUS = {
  "language.label": "Language",
  "language.chinese": "中文",
  "language.english": "EN",
  "sidebar.title": "Research Paper Q&A",
  "sidebar.detectedPaper": "Detected paper",
  "sidebar.apiBaseUrl": "API base URL",
  "sidebar.apiBaseUrlPlaceholder": "https://example.com/api",
  "sidebar.apiHelp": "Set the real API endpoint used by this extension.",
  "sidebar.saving": "Saving...",
  "sidebar.save": "Save",
  "sidebar.savedLocally": "Saved in this browser.",
  "sidebar.saveFailed": "Could not save the API address.",
  "sidebar.anchorDraft": "Anchor draft",
  "sidebar.useSelection": "Use selection",
  "sidebar.useSelectionUnavailable": "Use selection unavailable",
  "sidebar.useSelectionHintEnabled": "Drop a paper figure or capture the current passage before asking.",
  "sidebar.useSelectionHintDisabled": "Selection capture unavailable",
  "sidebar.manualAnchorNote": "Manual anchor note",
  "sidebar.add": "Add",
  "sidebar.questionComposer": "Ask on this paper",
  "sidebar.anchored": "Anchored",
  "sidebar.manual": "Manual",
  "sidebar.retryCapture": "Retry capture",
  "sidebar.clearAnchor": "Clear anchor",
  "sidebar.selectImage": "Select image",
  "sidebar.unrecognizedPaper": "This page was not identified as a paper. It may be a general webpage or lack reliable paper metadata.",
  "sidebar.createManualPaper": "Create and mark this page manually",
  "sidebar.questionBody": "Question body",
  "sidebar.questionCouldNotBeSubmitted": "Question could not be submitted.",
  "sidebar.submitting": "Submitting...",
  "sidebar.submitQuestion": "Submit question",
  "sidebar.discussionFilters": "Discussion filters",
  "sidebar.contentType": "Content type",
  "sidebar.status": "Status",
  "sidebar.anchorType": "Anchor type",
  "sidebar.participant": "Participant",
  "sidebar.sortDiscussions": "Sort discussions",
  "sidebar.all": "All",
  "sidebar.question": "Question",
  "sidebar.answer": "Answer",
  "sidebar.comment": "Comment",
  "sidebar.authorResponse": "Author response",
  "sidebar.open": "Open",
  "sidebar.answered": "Answered",
  "sidebar.resolved": "Resolved",
  "sidebar.authorResponded": "Author responded",
  "sidebar.disputed": "Disputed",
  "sidebar.text": "Text",
  "sidebar.image": "Image",
  "sidebar.screenshot": "Screenshot",
  "sidebar.figure": "Figure",
  "sidebar.table": "Table",
  "sidebar.formula": "Formula",
  "sidebar.reference": "Reference",
  "sidebar.authorResponses": "Author responses",
  "sidebar.newest": "Newest",
  "sidebar.heat": "Heat",
  "sidebar.loadingDiscussions": "Loading discussions...",
  "sidebar.couldNotLoadDiscussions": "Could not load discussions.",
  "sidebar.noDiscussionsYet": "No discussions yet for this paper.",
  "sidebar.discussionList": "Discussion list",
  "sidebar.authorResponseBadge": "Author response",
  "sidebar.heatShort": "heat",
  "sidebar.openDiscussion": "Open discussion",
  "sidebar.responseCount": "answers",
  "sidebar.commentCount": "comments",
  "sidebar.backToList": "Back to list",
  "sidebar.helpful": "Helpful",
  "sidebar.report": "Report",
  "sidebar.openWeb": "Open on web",
  "sidebar.responses": "Responses",
  "sidebar.noResponsesYet": "No responses yet.",
  "sidebar.replyingTo": "Replying to",
  "sidebar.replyToResponse": "Reply to response",
  "sidebar.responseBody": "Response body",
  "sidebar.replyCouldNotBeSubmitted": "Reply could not be submitted.",
  "sidebar.submitReply": "Submit reply"
} as const;

type MessageKey = keyof typeof enUS;

const zhCN: Record<MessageKey, string> = {
  "language.label": "语言",
  "language.chinese": "中文",
  "language.english": "EN",
  "sidebar.title": "科研文献问答",
  "sidebar.detectedPaper": "已识别文献",
  "sidebar.apiBaseUrl": "API 地址",
  "sidebar.apiBaseUrlPlaceholder": "https://example.com/api",
  "sidebar.apiHelp": "设置插件实际连接的 API 地址。",
  "sidebar.saving": "保存中...",
  "sidebar.save": "保存",
  "sidebar.savedLocally": "已保存在此浏览器中。",
  "sidebar.saveFailed": "无法保存 API 地址。",
  "sidebar.anchorDraft": "引用锚点",
  "sidebar.useSelection": "使用选中文本",
  "sidebar.useSelectionUnavailable": "选中文本不可用",
  "sidebar.useSelectionHintEnabled": "提问前可拖入论文图片，或捕获当前选中的段落。",
  "sidebar.useSelectionHintDisabled": "当前页面无法捕获选中文本",
  "sidebar.manualAnchorNote": "手动填写引用说明",
  "sidebar.add": "添加",
  "sidebar.questionComposer": "针对本文提问",
  "sidebar.anchored": "已关联",
  "sidebar.manual": "手动",
  "sidebar.retryCapture": "重新捕获",
  "sidebar.clearAnchor": "取消 anchor",
  "sidebar.selectImage": "选择图片",
  "sidebar.unrecognizedPaper": "这个网页没有被识别为文献，可能是普通网页或缺少可靠的文献元数据。",
  "sidebar.createManualPaper": "手动创建并标记此网页",
  "sidebar.questionBody": "问题内容",
  "sidebar.questionCouldNotBeSubmitted": "问题提交失败。",
  "sidebar.submitting": "提交中...",
  "sidebar.submitQuestion": "提交问题",
  "sidebar.discussionFilters": "讨论筛选",
  "sidebar.contentType": "内容类型",
  "sidebar.status": "状态",
  "sidebar.anchorType": "锚点类型",
  "sidebar.participant": "参与者",
  "sidebar.sortDiscussions": "讨论排序",
  "sidebar.all": "全部",
  "sidebar.question": "问题",
  "sidebar.answer": "回答",
  "sidebar.comment": "评论",
  "sidebar.authorResponse": "作者回应",
  "sidebar.open": "待回答",
  "sidebar.answered": "已回答",
  "sidebar.resolved": "已解决",
  "sidebar.authorResponded": "作者已回应",
  "sidebar.disputed": "有争议",
  "sidebar.text": "文本",
  "sidebar.image": "图片",
  "sidebar.screenshot": "截图",
  "sidebar.figure": "图",
  "sidebar.table": "表格",
  "sidebar.formula": "公式",
  "sidebar.reference": "参考文献",
  "sidebar.authorResponses": "作者回应",
  "sidebar.newest": "最新",
  "sidebar.heat": "热度",
  "sidebar.loadingDiscussions": "正在加载讨论...",
  "sidebar.couldNotLoadDiscussions": "无法加载讨论。",
  "sidebar.noDiscussionsYet": "这篇文献还没有讨论。",
  "sidebar.discussionList": "讨论列表",
  "sidebar.authorResponseBadge": "作者回应",
  "sidebar.heatShort": "热度",
  "sidebar.openDiscussion": "打开讨论",
  "sidebar.responseCount": "个回答",
  "sidebar.commentCount": "条评论",
  "sidebar.backToList": "返回列表",
  "sidebar.helpful": "有帮助",
  "sidebar.report": "举报",
  "sidebar.openWeb": "在网站中打开",
  "sidebar.responses": "回复",
  "sidebar.noResponsesYet": "还没有回复。",
  "sidebar.replyingTo": "回复",
  "sidebar.replyToResponse": "回复此内容",
  "sidebar.responseBody": "回复内容",
  "sidebar.replyCouldNotBeSubmitted": "回复提交失败。",
  "sidebar.submitReply": "提交回复"
};

type SidebarLocaleContextValue = {
  locale: SidebarLocale;
  setLocale: (locale: SidebarLocale) => void;
  t: (key: MessageKey) => string;
};

const fallbackLocaleContext: SidebarLocaleContextValue = {
  locale: "en-US",
  setLocale: () => undefined,
  t: (key) => enUS[key]
};

const SidebarLocaleContext = createContext<SidebarLocaleContextValue | null>(null);

function browserLocale(): SidebarLocale {
  return typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh")
    ? "zh-CN"
    : "en-US";
}

function isSidebarLocale(value: unknown): value is SidebarLocale {
  return value === "zh-CN" || value === "en-US";
}

export function SidebarLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SidebarLocale>(browserLocale);

  useEffect(() => {
    let mounted = true;
    const storage = typeof chrome !== "undefined" ? chrome.storage?.local : undefined;

    if (storage) {
      void storage.get(LOCALE_STORAGE_KEY).then((stored) => {
        const storedLocale = stored[LOCALE_STORAGE_KEY];
        if (mounted && isSidebarLocale(storedLocale)) {
          setLocaleState(storedLocale);
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value = useMemo<SidebarLocaleContextValue>(() => {
    const messages = locale === "zh-CN" ? zhCN : enUS;

    return {
      locale,
      setLocale(nextLocale) {
        setLocaleState(nextLocale);
        const storage = typeof chrome !== "undefined" ? chrome.storage?.local : undefined;
        if (storage) {
          void storage.set({ [LOCALE_STORAGE_KEY]: nextLocale });
        }
      },
      t: (key) => messages[key]
    };
  }, [locale]);

  return <SidebarLocaleContext.Provider value={value}>{children}</SidebarLocaleContext.Provider>;
}

export function useSidebarLocale() {
  return useContext(SidebarLocaleContext) ?? fallbackLocaleContext;
}
