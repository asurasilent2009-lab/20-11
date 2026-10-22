/* Câu hỏi trắc nghiệm. correctIndex tính từ 0 (0 = A, 1 = B, ...). */
window.App = window.App || {};
App.Data = App.Data || {};

App.Data.questions = [
  {
    id: 'q1', type: 'quiz',
    question: 'Câu 1. Ngày 20/10 hằng năm là ngày gì?',
    options: ['A. Ngày Quốc tế Phụ nữ', 'B. Ngày Phụ nữ Việt Nam', 'C. Ngày Nhà giáo Việt Nam', 'D. Ngày Gia đình Việt Nam'],
    correctIndex: 1
  },
  {
    id: 'q2', type: 'quiz',
    question: 'Câu 2. Ngày Phụ nữ Việt Nam được tổ chức lần đầu vào năm nào?',
    options: ['A. 1925', 'B. 1930', 'C. 1945', 'D. 1954'],
    correctIndex: 1
  },
  {
    id: 'q3', type: 'quiz',
    question: 'Câu 3. Hội Liên hiệp Phụ nữ Việt Nam được thành lập vào ngày nào?',
    options: ['A. 3/2/1930', 'B. 19/5/1945', 'C. 20/10/1930', 'D. 2/9/1945'],
    correctIndex: 2
  },
  {
    id: 'q4', type: 'quiz',
    question: 'Câu 4. Ai là người phụ nữ nổi tiếng với danh hiệu “Nữ tướng duy nhất của Việt Nam trong thời kỳ kháng chiến chống Mỹ”?',
    options: ['A. Nguyễn Thị Định', 'B. Nguyễn Thị Minh Khai', 'C. Võ Thị Sáu', 'D. Bùi Thị Xuân'],
    correctIndex: 0
  },
  {
    id: 'q5', type: 'quiz',
    question: 'Câu 5. Ai là người xinh gái nhất lớp mình?',
    options: ['A. Cô Đặng Thục Đoan', 'B. Các bạn nữ Tổ 1 với Tổ 2', 'C. Các bạn nữ Tổ 4 và Tổ 3', 'D. Tất cả các bạn nữ và cô Đặng Thục Đoan'],
    correctIndex: 3
  },
  {
    id: 'q6', type: 'quiz',
    question: 'Câu 6. Giọng ca vàng sẽ giúp lớp mình đạt mọi giải là ai?',
    options: ['A. Trần Huỳnh Thanh Đoan', 'B. Trương Huyền Nhi', 'C. Ngô Thị Khánh Chi', 'D. Phan Ngọc Bảo Hân'],
    correctIndex: 1
  },
  {
    id: 'q7', type: 'quiz',
    question: 'Câu 7. Lớp mình có bao nhiêu thành viên là cán bộ lớp?',
    options: ['A. 8', 'B. 9', 'C. 7', 'D. 6'],
    correctIndex: 0
  }
];
