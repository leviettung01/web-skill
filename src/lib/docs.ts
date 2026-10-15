export const POLICY_DOCS: Record<string, { heading: string; html: string }> = {
  '/huong-dan': {
    heading: 'Hướng dẫn mua hàng',
    html: `
<h2>Quy trình mua hàng 4 bước</h2>
<p><b>Bước 1 — Đăng ký tài khoản.</b> Truy cập trang <a href="/dang-ky">Đăng ký</a>, điền họ tên, email và mật khẩu. Quá trình chỉ mất khoảng 30 giây.</p>
<p><b>Bước 2 — Chọn sản phẩm.</b> Duyệt qua <a href="/san-pham">danh sách sản phẩm</a>, xem video demo và đọc mô tả chi tiết. Bấm "Thêm vào giỏ" hoặc "Mua ngay".</p>
<p><b>Bước 3 — Thanh toán.</b> Tại trang thanh toán, chọn phương thức (VietQR / MoMo / số dư ví), nhập mã giảm giá nếu có rồi bấm "Đặt hàng ngay".</p>
<p><b>Bước 4 — Nhận source code.</b> Quét mã QR chuyển khoản theo đúng số tiền và nội dung hiển thị. Sau khi xác nhận, link source code và license key sẽ xuất hiện trong mục <a href="/tai-khoan/san-pham">Sản phẩm của tôi</a>.</p>

<h2>Lưu ý khi chuyển khoản</h2>
<ul>
<li>Chuyển <b>đúng số tiền</b> hiển thị trên trang đơn hàng</li>
<li>Ghi <b>đúng nội dung chuyển khoản</b> (mã đơn hàng) để hệ thống tự động đối soát</li>
<li>Nếu sai nội dung, vui lòng liên hệ Zalo hỗ trợ kèm ảnh chụp giao dịch</li>
</ul>

<h2>Cách nhận sản phẩm</h2>
<p>Tuỳ loại sản phẩm, bạn sẽ nhận được:</p>
<ul>
<li><b>Source code:</b> link Google Drive chứa file .zip mã nguồn + tài liệu cài đặt</li>
<li><b>Chatbot:</b> link truy cập chatbot GPT/Gemini riêng</li>
<li><b>Bộ prompt:</b> link Google Sheet hoặc Google Doc chứa toàn bộ prompt</li>
<li><b>Combo:</b> tất cả sản phẩm con được kích hoạt cùng lúc</li>
</ul>

<h2>Gặp vấn đề?</h2>
<p>Liên hệ đội ngũ hỗ trợ qua <a href="/lien-he">trang liên hệ</a> hoặc chat Zalo trực tiếp. Chúng tôi phản hồi trong vòng 24 giờ (thường dưới 5 phút trong giờ làm việc 8:00–22:00).</p>
`
  },
  '/chinh-sach': {
    heading: 'Chính sách bảo hành & hoàn tiền',
    html: `
<h2>Chính sách giao hàng</h2>
<p>Toàn bộ sản phẩm trên SrcTool AI là sản phẩm số, được giao <b>tự động 100%</b>. Ngay khi đơn hàng chuyển sang trạng thái "Đã thanh toán", link truy cập và license key sẽ hiển thị trong tài khoản của bạn. Không cần chờ admin duyệt thủ công.</p>

<h2>Chính sách bảo hành</h2>
<ul>
<li>Hỗ trợ kỹ thuật miễn phí <b>6–12 tháng</b> tuỳ từng sản phẩm</li>
<li>Nhận bản cập nhật miễn phí <b>trọn đời</b></li>
<li>Hỗ trợ cài đặt qua Zalo hoặc Ultraview khi bạn gặp khó khăn</li>
<li>Với gói Combo All-In-One: tặng thêm 2 buổi setup 1-1 trực tiếp</li>
</ul>

<h2>Chính sách hoàn tiền</h2>
<p>Chúng tôi hoàn tiền <b>100%</b> trong vòng <b>7 ngày</b> kể từ ngày mua nếu:</p>
<ul>
<li>Sản phẩm không đúng như mô tả trên website</li>
<li>Source code không thể cài đặt được do lỗi từ phía chúng tôi</li>
<li>Link truy cập bị lỗi và không được khắc phục trong 48 giờ</li>
</ul>
<p><b>Không áp dụng hoàn tiền</b> trong các trường hợp: bạn đổi ý sau khi đã tải source code, thiết bị/môi trường của bạn không đáp ứng yêu cầu tối thiểu, hoặc bạn tự ý chỉnh sửa code gây lỗi.</p>

<h2>Chính sách bảo mật</h2>
<ul>
<li>Chúng tôi chỉ thu thập thông tin cần thiết: họ tên, email, số điện thoại</li>
<li>Mật khẩu được mã hoá bằng thuật toán PBKDF2-SHA256, chúng tôi không thể xem được mật khẩu của bạn</li>
<li>Không chia sẻ, bán hoặc trao đổi thông tin khách hàng cho bên thứ ba</li>
<li>Bạn có thể yêu cầu xoá tài khoản và dữ liệu bất cứ lúc nào qua kênh hỗ trợ</li>
</ul>
`
  },
  '/dieu-khoan': {
    heading: 'Điều khoản sử dụng',
    html: `
<h2>1. Chấp nhận điều khoản</h2>
<p>Khi truy cập và sử dụng website SrcTool AI, bạn đồng ý tuân thủ các điều khoản dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.</p>

<h2>2. Tài khoản người dùng</h2>
<ul>
<li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình</li>
<li>Không được chia sẻ tài khoản cho người khác sử dụng</li>
<li>Thông báo ngay cho chúng tôi nếu phát hiện tài khoản bị truy cập trái phép</li>
<li>Chúng tôi có quyền khoá tài khoản vi phạm mà không cần báo trước</li>
</ul>

<h2>3. Bản quyền sản phẩm</h2>
<p>Khi mua sản phẩm, bạn <b>được phép</b>:</p>
<ul>
<li>Sử dụng cho dự án cá nhân và thương mại không giới hạn</li>
<li>Chỉnh sửa mã nguồn theo nhu cầu riêng</li>
<li>Cài đặt trên không giới hạn số domain của chính bạn</li>
</ul>
<p>Bạn <b>không được phép</b>:</p>
<ul>
<li>Bán lại nguyên bản source code cho bên thứ ba</li>
<li>Chia sẻ công khai link tải hoặc license key</li>
<li>Đăng tải source code lên các diễn đàn chia sẻ miễn phí</li>
<li>Sử dụng thương hiệu SrcTool AI khi bán lại sản phẩm đã chỉnh sửa</li>
</ul>
<p>Vi phạm bản quyền sẽ dẫn đến việc <b>huỷ license vĩnh viễn</b> mà không hoàn tiền.</p>

<h2>4. Giới hạn trách nhiệm</h2>
<p>Chúng tôi cung cấp sản phẩm "nguyên trạng". SrcTool AI không chịu trách nhiệm cho các thiệt hại gián tiếp phát sinh từ việc sử dụng sản phẩm, bao gồm nhưng không giới hạn ở mất dữ liệu, mất doanh thu hoặc gián đoạn kinh doanh.</p>
<p>Các sản phẩm phụ thuộc vào API bên thứ ba (Veo 3, ChatGPT, Kling...). Chúng tôi không chịu trách nhiệm nếu các nền tảng này thay đổi chính sách, tăng giá hoặc ngừng dịch vụ, tuy nhiên sẽ cập nhật sản phẩm miễn phí trong khả năng có thể.</p>

<h2>5. Chương trình Affiliate</h2>
<ul>
<li>Hoa hồng được tính trên giá trị đơn hàng thực thu sau giảm giá</li>
<li>Không áp dụng cho đơn tự mua bằng mã của chính mình</li>
<li>Nghiêm cấm spam hoặc chạy quảng cáo trên thương hiệu SrcTool AI</li>
<li>Chúng tôi có quyền thu hồi hoa hồng nếu phát hiện gian lận</li>
</ul>

<h2>6. Thay đổi điều khoản</h2>
<p>Chúng tôi có thể cập nhật điều khoản này bất cứ lúc nào. Phiên bản mới nhất luôn được đăng tại trang này.</p>
`
  }
}
