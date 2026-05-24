/**
 * 特定商取引法・プライバシーポリシー・利用規約で共有する「事業者情報」の単一ソース。
 *
 * 🔴 運用ルール:
 *  - 社長から実値を受け取ったら **このファイルだけ** 編集すれば全ページに反映される。
 *  - 必須項目が未確定（OPERATOR_COMPLETE === false）の間は本番デプロイしないこと。
 *  - AUBE Japan の名称・住所・電話・メールは絶対に入れない（個人事業として運営）。
 *
 * 特商法（通信販売）では 氏名（名称）・住所・電話番号 の表示義務があるが、
 * 「請求があれば遅滞なく開示する旨を表示し、実際に遅滞なく開示できる措置を講じている」
 * 場合はこれらを公開ページから省略できる（消費者庁 / 特商法施行規則）。
 * → 各項目を mode で切替:
 *   - "public"     … 値をそのまま公開表示（value に実値が必要）
 *   - "on_request" … 公開せず「請求があれば遅滞なく開示」と表示（value は空でよい）
 *
 * メールアドレスは「請求時開示の受付窓口」になるため公開必須（mode を持たない）。
 * ※ 省略運用でも、請求が来たら実際に氏名・住所・電話を遅滞なく開示できる体制が前提。
 */
export type DisclosureMode = "public" | "on_request";

export type OperatorInfo = {
  /** 販売事業者名（屋号 または 氏名） */
  businessName: string;
  businessNameMode: DisclosureMode;
  /** 運営責任者の氏名 */
  responsibleName: string;
  responsibleNameMode: DisclosureMode;
  /** 問い合わせ／請求受付メール（公開必須・AUBE 不可） */
  email: string;
  /** 所在地 */
  address: string;
  addressMode: DisclosureMode;
  /** 電話番号 */
  phone: string;
  phoneMode: DisclosureMode;
};

/**
 * ⬇⬇⬇ 事業者情報（社長確定値）⬇⬇⬇
 * 方針: メールのみ公開、氏名・運営責任者・所在地・電話番号は「請求時開示」。
 */
export const OPERATOR: OperatorInfo = {
  businessName: "",
  businessNameMode: "on_request",
  responsibleName: "",
  responsibleNameMode: "on_request",
  email: "manafushi.1999@gmail.com",
  address: "",
  addressMode: "on_request",
  phone: "",
  phoneMode: "on_request",
};
/**
 * ⬆⬆⬆ 事業者情報 ⬆⬆⬆
 */

const PENDING_TAG = "要社長確認";
const ON_REQUEST_TEXT =
  "ご請求があった場合に遅滞なく開示いたします。開示をご希望の場合はメールにてご連絡ください。";

export type FieldDisplay = { text: string; pending: boolean };

/** 必須テキスト項目。未入力なら {要社長確認：label} を返す。 */
export function fieldValue(value: string, label: string): FieldDisplay {
  if (value && value.trim() !== "") return { text: value, pending: false };
  return { text: `{${PENDING_TAG}：${label}}`, pending: true };
}

/** 公開／請求時開示を選べる項目。on_request は値が空でも開示文を表示する。 */
export function disclosureValue(value: string, mode: DisclosureMode, label: string): FieldDisplay {
  if (mode === "on_request") return { text: ON_REQUEST_TEXT, pending: false };
  return fieldValue(value, label);
}

/** 「請求により開示」とした項目のラベル一覧（特商法ページの補足注記用）。 */
export function onRequestLabels(): string[] {
  const labels: string[] = [];
  if (OPERATOR.businessNameMode === "on_request") labels.push("販売事業者名");
  if (OPERATOR.responsibleNameMode === "on_request") labels.push("運営責任者");
  if (OPERATOR.addressMode === "on_request") labels.push("所在地");
  if (OPERATOR.phoneMode === "on_request") labels.push("電話番号");
  return labels;
}

/** すべての必須項目が確定済みか（false の間は本番公開しない）。 */
export const OPERATOR_COMPLETE: boolean =
  OPERATOR.email.trim() !== "" &&
  (OPERATOR.businessNameMode === "on_request" || OPERATOR.businessName.trim() !== "") &&
  (OPERATOR.responsibleNameMode === "on_request" || OPERATOR.responsibleName.trim() !== "") &&
  (OPERATOR.addressMode === "on_request" || OPERATOR.address.trim() !== "") &&
  (OPERATOR.phoneMode === "on_request" || OPERATOR.phone.trim() !== "");
