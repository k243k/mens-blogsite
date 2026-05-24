#!/usr/bin/env python3
"""本番に本物記事（デモ・架空店舗）を投入するスクリプト。

使い方:
    SUPABASE_URL=... SERVICE_ROLE=... python3 scripts/seed_prod_content.py

方針:
- 実在店名は使わない（捏造レビューの景表法/ステマリスク回避）。架空店舗のデモ。
- 非露骨・店舗判断軸（料金/清潔感/接客/雰囲気/距離感/初心者/写真ギャップ/再訪）。
- 有料本文は review_paid_contents に分離保存（reviews には入れない）。
- 秘密は環境変数から受け取る（ハードコードしない）。
"""
import json
import os
import sys
import urllib.request

URL = os.environ["SUPABASE_URL"].rstrip("/")
SR = os.environ["SERVICE_ROLE"]
H = {
    "apikey": SR,
    "Authorization": f"Bearer {SR}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


def req(method: str, path: str, body=None, prefer=None):
    headers = dict(H)
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(URL + path, data=data, headers=headers, method=method)
    with urllib.request.urlopen(r) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else None


# --- 0) 旧サンプル記事を削除（本物へ差し替え） ---
req("DELETE", "/rest/v1/reviews?slug=eq.osaka-umeda-lumiere-first", prefer="return=minimal")
print("旧サンプル削除")

# --- 1) エリア（umeda/namba は既存。nipponbashi/kyoto を追加） ---
AREAS = [
    {"name": "梅田", "slug": "umeda", "description": "大阪の中心。アクセス良好で初心者でも入りやすい店が多いエリア。", "display_order": 1, "status": "published"},
    {"name": "難波", "slug": "namba", "description": "深夜帯まで営業する店が多い繁華街。", "display_order": 2, "status": "published"},
    {"name": "日本橋", "slug": "nipponbashi", "description": "難波至近。落ち着いた個室系が増えているエリア。", "display_order": 3, "status": "published"},
    {"name": "京都", "slug": "kyoto", "description": "静かで上品な雰囲気の店が中心。", "display_order": 4, "status": "published"},
]
req("POST", "/rest/v1/areas?on_conflict=slug", AREAS, prefer="resolution=merge-duplicates,return=minimal")
areas = {a["slug"]: a["id"] for a in req("GET", "/rest/v1/areas?select=id,slug")}
print("エリア:", list(areas.keys()))

# --- 2) 店舗 + 3) 記事（5本：梅田2 / 難波1・日本橋1 / 京都1） ---
ARTICLES = [
    {
        "area": "umeda", "shop_slug": "lumiere-umeda", "shop_name": "Lumiere 梅田",
        "station": "梅田駅 徒歩5分", "price_min": 12000, "price_max": 22000, "hours": "12:00 - 翌2:00",
        "shop_desc": "間接照明の落ち着いた個室が特徴の一軒。",
        "slug": "umeda-lumiere-night", "title": "梅田の隠れ家スパ、初心者でも肩の力が抜けた夜",
        "price": 16000, "minutes": 90, "unit_price": 500,
        "summary": "初心者でも入りやすく、雰囲気と清潔感のバランスが良い一軒。",
        "free": "受付からの距離感が心地よく、すぐに肩の力が抜けた。店内は間接照明で統一され、清潔感がしっかりある。タオルもふかふかで好印象。料金は平均よりやや高めだが、雰囲気込みで考えれば納得できる範囲。初めての一軒に向いている。",
        "scores": {"overall": 4.6, "sensual": 4.5, "cleanliness": 4.7, "service": 4.6, "distance": 4.4, "photo_accuracy": 4.2, "beginner": 4.8, "cost": 4.1, "revisit": 4.6},
        "paid": {"body": "予約時の対応から丁寧で、当日の流れも分かりやすかった。", "photo_gap": "写真より実物の清潔感が上。誇張は感じない。", "satisfaction": "料金に対する満足度は高め。", "revisit_opinion": "また行きたい。次は別コースを試したい。", "beginner_caution": "完全予約制なので飛び込み不可。事前連絡を。", "target_type": "初めてで失敗したくない人向け。"},
    },
    {
        "area": "umeda", "shop_slug": "aromablanc-umeda", "shop_name": "Aroma Blanc 梅田",
        "station": "中津駅 徒歩6分", "price_min": 10000, "price_max": 18000, "hours": "13:00 - 24:00",
        "shop_desc": "白基調の清潔感ある内装。アロマの香りが強め。",
        "slug": "umeda-aromablanc-first", "title": "梅田・中津、香りで選ぶならまず候補に入る一軒",
        "price": 13000, "minutes": 80, "unit_price": 500,
        "summary": "アロマの世界観が強く、リラックス重視の人に刺さる。",
        "free": "店に入った瞬間の香りで一気に切り替わる。白を基調にした内装は清潔感があり、初見でも緊張しにくい。接客は柔らかく距離の詰め方が上手い。価格は梅田では標準的で、コスパは悪くない。",
        "scores": {"overall": 4.3, "sensual": 4.2, "cleanliness": 4.6, "service": 4.5, "distance": 4.3, "photo_accuracy": 4.0, "beginner": 4.4, "cost": 4.3, "revisit": 4.2},
        "paid": {"body": "香りの好みが分かれるので、強い香りが苦手なら事前相談を。", "photo_gap": "内装は写真通り。", "satisfaction": "リラックス目的なら満足度高い。", "revisit_opinion": "気分で再訪したい。", "beginner_caution": "アロマが強めなので体調次第で。", "target_type": "癒し・リラックス重視の人。"},
    },
    {
        "area": "namba", "shop_slug": "velvet-namba", "shop_name": "Velvet Room 難波",
        "station": "なんば駅 徒歩3分", "price_min": 10000, "price_max": 18000, "hours": "13:00 - 翌3:00",
        "shop_desc": "深夜帯に強い。リピーター多め。",
        "slug": "namba-velvet-late", "title": "難波の深夜、静かな熱を感じたVelvet Room",
        "price": 14000, "minutes": 80, "unit_price": 500,
        "summary": "深夜帯でも質が落ちない。再訪したくなる距離感。",
        "free": "終電後でも雰囲気が緩まないのが良い。難波駅至近でアクセスも楽。接客は程よい距離感で、初対面でも会話が自然に続く。深夜利用の選択肢として覚えておきたい一軒。",
        "scores": {"overall": 4.4, "sensual": 4.6, "cleanliness": 4.2, "service": 4.5, "distance": 4.6, "photo_accuracy": 4.1, "beginner": 4.3, "cost": 4.2, "revisit": 4.5},
        "paid": {"body": "深夜は混みやすいので予約推奨。", "photo_gap": "写真とのギャップは少なめ。", "satisfaction": "深夜帯の満足度は高い。", "revisit_opinion": "再訪あり。深夜の定番にできる。", "beginner_caution": "深夜は予約必須。", "target_type": "仕事終わりが遅い人。"},
    },
    {
        "area": "nipponbashi", "shop_slug": "noir-nipponbashi", "shop_name": "Noir 日本橋",
        "station": "日本橋駅 徒歩4分", "price_min": 11000, "price_max": 20000, "hours": "12:00 - 24:00",
        "shop_desc": "ダークトーンの落ち着いた個室。",
        "slug": "nipponbashi-noir-clean", "title": "日本橋Noir、清潔感とプライバシーで選ぶ一軒",
        "price": 15000, "minutes": 90, "unit_price": 800,
        "summary": "プライバシー配慮が行き届き、落ち着いて過ごせる。",
        "free": "個室の独立性が高く、人目を気にせず過ごせる。ダークトーンの内装は大人っぽく、清潔感も十分。接客は控えめで、自分のペースを保ちたい人に向く。価格はやや高めだが空間の質で納得できる。",
        "scores": {"overall": 4.5, "sensual": 4.3, "cleanliness": 4.8, "service": 4.4, "distance": 4.2, "photo_accuracy": 4.4, "beginner": 4.5, "cost": 4.0, "revisit": 4.4},
        "paid": {"body": "静かに過ごしたい人に最適。", "photo_gap": "実物の方が上品。", "satisfaction": "空間の満足度が高い。", "revisit_opinion": "落ち着きたい時に再訪したい。", "beginner_caution": "やや高めなので予算に余裕を。", "target_type": "静かに過ごしたい・プライバシー重視の人。"},
    },
    {
        "area": "kyoto", "shop_slug": "kyohanare-kyoto", "shop_name": "京離れ",
        "station": "祇園四条駅 徒歩7分", "price_min": 13000, "price_max": 24000, "hours": "14:00 - 23:00",
        "shop_desc": "京町家風の静かな一軒。",
        "slug": "kyoto-kyohanare-quiet", "title": "京都・祇園、静けさで選ぶ大人の一軒",
        "price": 18000, "minutes": 100, "unit_price": 800,
        "summary": "静けさと所作の丁寧さが際立つ、落ち着いた一軒。",
        "free": "京町家風の佇まいで、入る前から空気が違う。所作が丁寧で、急かされる感じが一切ない。観光ついでというより、ゆっくり時間を取れる日に向く。価格は高めだが京都の雰囲気込みで価値がある。",
        "scores": {"overall": 4.7, "sensual": 4.4, "cleanliness": 4.7, "service": 4.8, "distance": 4.3, "photo_accuracy": 4.5, "beginner": 4.2, "cost": 3.9, "revisit": 4.6},
        "paid": {"body": "時間に余裕を持って訪れたい。", "photo_gap": "雰囲気は写真以上。", "satisfaction": "満足度は高いが価格も高め。", "revisit_opinion": "特別な日に再訪したい。", "beginner_caution": "予約が取りにくい時期あり。", "target_type": "静けさと質を重視する人。"},
    },
]

SCORE_COLS = {"overall": "overall_score", "sensual": "sensual_score", "cleanliness": "cleanliness_score",
              "service": "service_score", "distance": "distance_score", "photo_accuracy": "photo_accuracy_score",
              "beginner": "beginner_score", "cost": "cost_score", "revisit": "revisit_score"}

for a in ARTICLES:
    # 店舗 upsert
    req("POST", "/rest/v1/shops?on_conflict=slug", [{
        "area_id": areas[a["area"]], "name": a["shop_name"], "slug": a["shop_slug"],
        "station": a["station"], "price_min": a["price_min"], "price_max": a["price_max"],
        "business_hours": a["hours"], "description": a["shop_desc"], "status": "published",
    }], prefer="resolution=merge-duplicates,return=minimal")
    shop = req("GET", f"/rest/v1/shops?select=id&slug=eq.{a['shop_slug']}")[0]

    # レビュー（無料情報のみ・published）
    rev = req("POST", "/rest/v1/reviews", {
        "shop_id": shop["id"], "area_id": areas[a["area"]], "title": a["title"], "slug": a["slug"],
        "price": a["price"], "course_minutes": a["minutes"], "summary": a["summary"],
        "free_body": a["free"], "is_paid": True, "unit_price": a["unit_price"],
        "status": "published", "published_at": "2026-05-25T00:00:00Z",
    })[0]
    rid = rev["id"]

    # スコア9指標
    scores = {SCORE_COLS[k]: v for k, v in a["scores"].items()}
    scores["review_id"] = rid
    req("POST", "/rest/v1/review_scores", scores, prefer="return=minimal")

    # 有料本文（分離）
    p = a["paid"]
    req("POST", "/rest/v1/review_paid_contents", {
        "review_id": rid, "body": p["body"], "photo_gap": p["photo_gap"],
        "satisfaction": p["satisfaction"], "revisit_opinion": p["revisit_opinion"],
        "beginner_caution": p["beginner_caution"], "target_type": p["target_type"],
    }, prefer="return=minimal")
    print(f"投入: {a['slug']} ({a['area']}) ¥{a['unit_price']}")

print("=== 完了 ===")
