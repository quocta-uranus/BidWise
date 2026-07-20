# Hướng dẫn Trả lời Câu hỏi — Feature 5: Smart Matching & MCDM Engine

**Dự án:** BidWise — FPT University Capstone 2025  
**Mục đích:** Chuẩn bị câu hỏi & trả lời khi giáo viên hỏi về logic thuật toán

---

## TỔNG QUAN: Feature 5 giải quyết vấn đề gì?

> **Câu hỏi:** Feature 5 này giải quyết bài toán gì trong BidWise?

**Trả lời:**
BidWise là nền tảng đấu thầu freelance. Feature 5 giải quyết 3 bài toán cốt lõi:
1. **Xếp hạng bid** — Client có hàng chục bid, cần một phương pháp khách quan để chọn bid tốt nhất theo nhiều tiêu chí (giá, kỹ năng, kinh nghiệm, v.v.)
2. **Phát hiện spam** — Freelancer copy-paste cover letter giống nhau để bid nhiều job, cần phát hiện và cảnh báo
3. **Gợi ý phù hợp** — Freelancer cần tìm job phù hợp kỹ năng, Client cần tìm freelancer phù hợp job, kể cả khi chưa có lịch sử hợp tác

---

## PHẦN 1: AHP-TOPSIS — Xếp hạng Bid

### Q1: AHP là gì và nó giải quyết vấn đề gì?

**Trả lời:**
AHP (Analytic Hierarchy Process) — phương pháp của Saaty (1980) — giải quyết bài toán **xác định trọng số cho nhiều tiêu chí**. Khi Client muốn chọn bid, họ cần cân nhắc 7 tiêu chí: Giá, Kỹ năng, Kinh nghiệm, Rating, Tốc độ, Deadline, Portfolio. AHP cho phép Client so sánh từng cặp tiêu chí ("Giá quan trọng hơn Rating bao nhiêu lần?") để ra được bộ trọng số hợp lý.

---

### Q2: AHP hoạt động như thế nào? Các bước cụ thể?

**Trả lời (từng bước):**

```
Bước 1: Xây dựng ma trận so sánh cặp (pairwise matrix 7×7)
  - Mỗi ô a[i][j] = "tiêu chí i quan trọng hơn tiêu chí j bao nhiêu lần"
  - Thang điểm Saaty: 1 (ngang nhau) → 9 (cực kỳ quan trọng hơn)
  - Tính chất: a[j][i] = 1/a[i][j]

Bước 2: Tính Geometric Mean mỗi hàng
  g_i = (∏ a[i][j])^(1/n)   // nhân tất cả phần tử hàng i, rồi lấy căn n

Bước 3: Chuẩn hóa → Priority Vector (trọng số)
  w_i = g_i / Σg_i          // trọng số mỗi tiêu chí, tổng = 1

Bước 4: Kiểm tra tính nhất quán (CR)
  λ_max = (1/n) × Σ (Aw)_i / w_i
  CI = (λ_max - n) / (n - 1)
  CR = CI / RI[n]            // RI[7] = 1.32 (bảng Saaty)
  
  → Nếu CR ≤ 0.1: ma trận nhất quán, chấp nhận trọng số
  → Nếu CR > 0.1: ma trận mâu thuẫn, yêu cầu Client nhập lại
```

---

### Q3: CR (Consistency Ratio) là gì? Tại sao cần nó?

**Trả lời:**
CR kiểm tra xem các đánh giá của Client có **logic nhất quán** không.

**Ví dụ mâu thuẫn:** Client nói "Giá quan trọng hơn Kỹ năng" nhưng lại nói "Kỹ năng quan trọng hơn Rating" và "Rating quan trọng hơn Giá" — đây là vòng tròn mâu thuẫn. CR phát hiện điều này.

- **CR = 0**: hoàn toàn nhất quán (dùng exact percentage weights → CR = 0)
- **CR ≤ 0.1**: chấp nhận được (Saaty khuyến nghị)
- **CR > 0.1**: bị reject

Trong hệ thống BidWise, các preset dùng **exact weights** nên CR = 0 by construction.

---

### Q4: TOPSIS là gì? Nó hoạt động ra sao?

**Trả lời:**
TOPSIS (Hwang & Yoon, 1981) = Technique for Order Preference by Similarity to Ideal Solution — xếp hạng các bid dựa trên **khoảng cách đến giải pháp lý tưởng**.

```
Bước 1: Chuẩn hóa ma trận quyết định
  r[i][j] = x[i][j] / √(Σ x[k][j]²)   // vector normalization

Bước 2: Nhân với trọng số AHP
  v[i][j] = w[j] × r[i][j]

Bước 3: Xác định Ideal Best (A+) và Ideal Worst (A-)
  A+ = max mỗi cột (trừ Giá: min là tốt nhất)
  A- = min mỗi cột (trừ Giá: max là tệ nhất)

Bước 4: Tính khoảng cách Euclidean
  d+_i = √Σ(v[i][j] - A+[j])²
  d-_i = √Σ(v[i][j] - A-[j])²

Bước 5: Tính TOPSIS Score (Closeness Coefficient)
  C_i = d-_i / (d+_i + d-_i)    // 0 → 1, càng cao càng tốt

Bước 6: Sort desc → đây là ranking
```

---

### Q5: AHP và TOPSIS kết hợp với nhau như thế nào?

**Trả lời:**
- **AHP** xác định **bộ trọng số** (w_1...w_7) phản ánh ưu tiên của Client
- **TOPSIS** dùng bộ trọng số đó để **tính score và xếp hạng** các bid

AHP giải quyết câu hỏi "tiêu chí nào quan trọng hơn?", TOPSIS giải quyết câu hỏi "bid nào tốt hơn theo các tiêu chí đó?".

---

### Q6: Có 3 preset là gì? Ý nghĩa từng preset?

**Trả lời:**

| Preset | Ý nghĩa | Trọng số nổi bật |
|--------|---------|-----------------|
| **BEST_VALUE** | Cân bằng giá và chất lượng | Giá 40%, Kỹ năng 25% |
| **QUALITY_FIRST** | Ưu tiên chất lượng, không quan trọng giá | Kỹ năng 35%, Rating 20%, Giá chỉ 10% |
| **FAST_DELIVERY** | Ưu tiên giao hàng nhanh | Deadline 25%, Tốc độ 15% |

---

### Q7: Kết quả đánh giá AHP-TOPSIS thế nào?

**Trả lời:**
- Chạy trên **65 jobs**, **500 bids** từ 500 freelancer profiles
- **Kendall's τ = 0.575** → tương quan dương mạnh (target ≥ 0.40 ✅)
- **CR ≤ 0.1 compliance: 100%** trên tất cả test cases
- Kết luận: Thuật toán xếp hạng đúng hướng, bid có giá thấp hơn + kỹ năng phù hợp hơn được rank cao hơn

> **Kendall's τ đo cái gì?** Đo mức độ đồng thuận giữa ranking của TOPSIS và ranking "ground truth" (rank theo skill overlap × inverse price). τ = 0.575 nghĩa là hơn 57% cặp bid được xếp đúng thứ tự tương đối nhau.

---

## PHẦN 2: NLP Spam Detection — Phát hiện Bid Spam

### Q8: Bài toán spam detection ở đây là gì?

**Trả lời:**
Nhiều freelancer dùng **template cover letter** — gửi cùng một đoạn văn cho tất cả các job, chỉ thay tên job hoặc không thay gì cả. Client không thể biết bid nào là thực sự được viết riêng. Hệ thống phát hiện các cover letter quá giống nhau (similarity ≥ 85%) và gán nhãn `isTemplateBid = true`.

---

### Q9: TF-IDF là gì? Tại sao dùng TF-IDF thay vì so sánh chuỗi trực tiếp?

**Trả lời:**
**So sánh chuỗi trực tiếp** không hiệu quả vì: "Tôi có 5 năm kinh nghiệm React" và "Kinh nghiệm React của tôi là 5 năm" — nội dung giống nhau nhưng string khác hoàn toàn.

**TF-IDF** biến câu thành vector số theo từ:
```
TF(từ, văn bản) = số lần từ xuất hiện / tổng số từ trong văn bản
IDF(từ) = log(1 + N / (1 + df)) + 1    // N = tổng docs, df = số docs chứa từ đó

TF-IDF(từ, văn bản) = TF × IDF
```

**Tại sao TF-IDF tốt:** Từ phổ biến ("tôi", "có", "và") có IDF thấp → ít ảnh hưởng. Từ đặc trưng ("React", "microservices") có IDF cao → ảnh hưởng nhiều. Vì vậy hai câu cùng chủ đề sẽ có vector gần nhau dù cấu trúc câu khác.

---

### Q10: Cosine Similarity là gì? Tại sao dùng Cosine chứ không dùng Euclidean Distance?

**Trả lời:**
```
Cosine(A, B) = (A · B) / (|A| × |B|)   // dot product / tích độ dài
→ Range: 0 (hoàn toàn khác) → 1 (hoàn toàn giống)
```

**Lý do chọn Cosine thay vì Euclidean:**
- Cover letter ngắn và cover letter dài cùng nội dung → Euclidean distance sẽ lớn (vì vector dài hơn) nhưng Cosine sẽ ≈ 1 (vì góc giữa 2 vector nhỏ)
- Cosine đo **hướng** (chủ đề), không đo **độ lớn** (độ dài văn bản) → phù hợp hơn cho text comparison

---

### Q11: Quy trình spam detection hoạt động như thế nào khi freelancer submit bid?

**Trả lời:**
```
1. Freelancer submit bid với cover letter mới
2. Hệ thống lấy 50 cover letter cũ nhất của freelancer đó từ DB
3. Tạo corpus = [cover letter mới] + [50 letter cũ]
4. Tính TF-IDF vectors cho toàn bộ corpus
5. Tính cosine similarity giữa letter mới và từng letter cũ
6. Nếu max(similarity) ≥ 0.85 → isTemplateBid = true, spamScore = max_sim
7. Lưu vào DB, trả về cùng ranked bid response
8. UI hiển thị badge "Template Bid" màu cam
```

---

### Q12: Kết quả spam detection ra sao? Tại sao F1 = 0%?

**Trả lời:**
| Metric | Giá trị |
|--------|---------|
| Database evaluation Accuracy | 75% |
| Database evaluation F1 | 0% |
| Synthetic test accuracy | 67% |

**Tại sao F1 = 0% trên database?**
- Dữ liệu seed được tạo tổng hợp (synthetic), các "spam bids" được tạo bằng cách biến tấu nhẹ từ template
- Trong DB seed, không có đủ cặp bid thực sự copy-paste → model không phát hiện được spam nào (precision = 0, recall = 0 → F1 = 0)
- Accuracy = 75% vì 75% bid thực ra là genuine (not spam), mô hình predict all-genuine → vẫn đúng 75%

**Synthetic test (controlled):**
- Letter giống hệt → similarity = 1.0 (phát hiện đúng)
- Thay tên biến thể → ⚠️ edge case
- Hai lĩnh vực khác nhau → vẫn có vấn đề false positive

---

## PHẦN 3: Content-Based Recommendation — Gợi ý phù hợp

### Q13: Bài toán recommendation ở đây là gì? Tại sao không dùng Collaborative Filtering?

**Trả lời:**
**Bài toán:** Khi freelancer vào BidWise, muốn thấy ngay các job phù hợp kỹ năng. Khi client đăng job, muốn thấy gợi ý freelancer phù hợp.

**Tại sao không dùng Collaborative Filtering (CF)?**
- CF cần **lịch sử tương tác lớn** ("User A và B đều thuê C → gợi ý cho A những gì B thuê")
- BidWise là hệ thống mới, **cold start problem** nghiêm trọng
- CF cần ≥ 10,000 hợp đồng hoàn thành → chưa có dữ liệu

**Content-Based** hoạt động chỉ dựa trên **nội dung hồ sơ và job description** → giải quyết cold start.

---

### Q14: Content-Based Recommendation hoạt động như thế nào?

**Trả lời:**

**Xây dựng Job Vector:**
```
Job Document = title + " " + description + " " + skills.join(" ")
→ TF-IDF vectorize → job_vector (sparse vector theo từ vựng chung)
```

**Xây dựng Freelancer Vector (Skill Graph):**
```
FL Document = skills.join(" ") × 3   // lặp 3 lần để amplify signal
            + portfolio_titles
            + portfolio_descriptions
            + bio
→ TF-IDF vectorize → fl_vector
```
> **Tại sao skills × 3?** Skills là yếu tố quan trọng nhất. Lặp 3 lần tăng TF của các skill keywords → IDF tương đối cao hơn trong vector → cosine similarity chịu ảnh hưởng nhiều hơn từ skill match.

**Tính điểm và sắp xếp:**
```
// Gợi ý job cho Freelancer:
scores = [(job_id, cosine(fl_vector, job_vector)) for mỗi job OPEN]
return top-10 jobs sort desc

// Gợi ý freelancer cho Client:
scores = [(fl_id, cosine(fl_vector, job_vector)) for mỗi FL available]
return top-10 FLs sort desc
```

---

### Q15: Cold-start được giải quyết thế nào?

**Trả lời:**
**Cold-start problem:** Freelancer mới đăng ký, chưa có hợp đồng, chưa có reviews — làm sao gợi ý?

**Giải pháp trong BidWise:**
1. **Skills trong profile** → dùng ngay làm Freelancer Vector, không cần lịch sử
2. **Assessment score** → bootstrap reputation tier (nếu điểm test cao → xếp SILVER dù chưa có review)
3. **Portfolio** → tiêu đề và mô tả portfolio được tích hợp vào vector

→ Freelancer mới chỉ cần điền skills + portfolio là đã nhận được job recommendations

---

### Q16: Kết quả đánh giá Recommendation ra sao?

**Trả lời:**
Chạy trên **30 open jobs**, **50 freelancers** available:

| Metric | Giá trị | Target | Kết quả |
|--------|---------|--------|---------|
| Precision@5 | **96.7%** | ≥ 60% | ✅ Vượt |
| Hit Rate@10 | **96.7%** | ≥ 80% | ✅ Vượt |
| Avg Skill Overlap@5 | **57.5%** | — | — |

**Precision@5:** Trung bình trong top-5 freelancer được gợi ý, 96.7% có ít nhất 1 skill trùng với job
**Hit Rate@10:** 96.7% các job tìm được ít nhất 1 freelancer phù hợp trong top-10

---

## PHẦN 4: Multi-Dimensional Reputation

### Q17: Reputation system hoạt động thế nào?

**Trả lời:**
Thay vì 1 điểm tổng, BidWise chia reputation theo **skill cluster** (nhóm kỹ năng):

```
Clusters: frontend, backend, mobile, design, devops, data

Skill → Cluster mapping (ví dụ):
  react, vue, css, html → frontend
  nestjs, prisma, postgresql → backend
  flutter, swift → mobile
```

**Khi contract hoàn thành:**
```
Client review → review_score (1-5)
Hệ thống map job_skills → skill_clusters
Với mỗi cluster liên quan:
  new_score = old_score × 0.8 + review_score × 0.2   // Weighted Moving Average
```

**Tại sao Weighted Moving Average?** Review gần đây phản ánh năng lực hiện tại tốt hơn review cũ 2 năm. WMA cho phép điểm "trôi" theo thời gian.

---

### Q18: Bid Token Tier System hoạt động thế nào?

**Trả lời:**
Số bid mỗi ngày phụ thuộc vào reputation tier:

| Tier | Điều kiện | Bid/ngày |
|------|-----------|---------|
| NEW | Score 0–1.9 (chưa có reviews) | 5 |
| SILVER | Score 2.0–3.4 | 15 |
| GOLD | Score 3.5–4.4 | 30 |
| VERIFIED | Score 4.5–5.0 | Unlimited |

**Cold-start:** Freelancer mới không có reviews → dùng `assessmentScore` để bootstrap tier ban đầu thay vì bắt buộc bắt đầu ở NEW.

---

## PHẦN 5: Câu hỏi tổng hợp

### Q19: Điểm mạnh và điểm yếu của từng thuật toán?

**AHP-TOPSIS:**
- ✅ Có cơ sở toán học vững chắc (Saaty 1980, Hwang 1981)
- ✅ Minh bạch, giải thích được
- ❌ AHP không scale tốt khi n > 9 tiêu chí
- ❌ Trọng số phụ thuộc vào nhận định chủ quan của Client

**NLP Spam Detection:**
- ✅ Pure TypeScript, không cần external ML lib
- ✅ Bilingual (EN + VI stopwords)
- ❌ TF-IDF + cosine không phân biệt được paraphrase (viết lại ý giống nhau)
- ❌ F1 thấp trên data thực, cần data spam thực để cải thiện

**Content-Based Recommendation:**
- ✅ Giải quyết cold-start problem tốt
- ✅ Precision@5 = 96.7% vượt target
- ❌ Không học từ hành vi người dùng (không biết client thích freelancer nào)
- ❌ TF-IDF không hiểu semantic ("React developer" vs "front-end engineer")

---

### Q20: Tại sao chọn Kendall's τ để đánh giá AHP-TOPSIS thay vì accuracy?

**Trả lời:**
Ranking là bài toán **thứ tự tương đối**, không phải classification. Không có "đáp án đúng tuyệt đối" cho bid nào là tốt nhất. Kendall's τ đo:

```
τ = (số cặp bid được xếp đúng thứ tự) - (số cặp bị đảo ngược)
    ─────────────────────────────────────────────────────────────
                    tổng số cặp có thể
```

τ = 0.575 → 57.5% cặp bid được TOPSIS và ground truth đồng thuận về thứ tự → Strong positive correlation.

---

### Q21: Hệ thống có thể nâng cấp lên Collaborative Filtering hay không?

**Trả lời:**
Có, đây là Phase 2 đã được lên kế hoạch:
- Khi BidWise có ≥ 10,000 hợp đồng hoàn thành → đủ data cho Matrix Factorization
- Phase 2 sẽ thêm CF song song với Content-Based (Hybrid approach)
- Hiện tại Content-Based là lựa chọn đúng vì hệ thống còn mới (cold-start problem)

---

### Q22: Các API endpoint của Feature 5 là gì?

**Trả lời:**

| Endpoint | Method | Role | Chức năng |
|----------|--------|------|-----------|
| `/client/ahp/presets` | GET | PUBLIC | Lấy 3 preset AHP |
| `/client/ahp/validate` | POST | CLIENT | Validate ma trận AHP, tính CR |
| `/client/bids/ranked/:jobId` | GET | CLIENT | Lấy ranked bids dùng TOPSIS |
| `/recommendations/jobs` | GET | FREELANCER | Gợi ý jobs cho FL |
| `/recommendations/freelancers/:jobId` | GET | CLIENT | Gợi ý FLs cho Client |
| `/recommendations/rebuild-vector` | POST | FREELANCER | Rebuild skill vector |
| `/reputation/:freelancerId` | GET | PUBLIC | Xem reputation theo cluster |
| `/reputation/me` | GET | FREELANCER | Reputation cá nhân + benchmark |

---

### Q23: Tại sao cần seed 500 bids để đánh giá thuật toán?

**Trả lời:**
- **Statistical significance:** Kết quả trên <50 samples không đáng tin cậy, outlier ảnh hưởng lớn
- **Coverage:** Cần bids đa dạng về giá, kỹ năng, kinh nghiệm để TOPSIS có đủ phổ để xếp hạng
- **Spam detection:** Cần đủ pairs (cùng freelancer bid nhiều job) để test TF-IDF cosine similarity
- **Recommendation:** Cần đủ freelancer đa dạng kỹ năng để test Precision@K có ý nghĩa

---

*Tài liệu này được tạo từ `PLAN.md` và `ALGORITHM_REPORT.md` — BidWise Feature-5*
