"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Tour = {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  location?: string;
  price?: number;
  start_date?: string;
  end_date?: string;
  image?: string;
  capacity?: number;
};
type Review = {
  _id?: string;
  user?: { _id?: string; name?: string } | string;
  tour?: string;
  content: string;
  rating: number;
  createdAt?: string;
};

const BASE = process.env.NEXT_PUBLIC_API_URL;

export default function ViewTourPage({ searchParams }: { searchParams: { id?: string } }) {
  const router = useRouter();
  const id = searchParams?.id;
  const [tour, setTour] = useState<Tour | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [numPeople, setNumPeople] = useState<number>(1);

  // State cho reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [newReview, setNewReview] = useState({ content: "", rating: 5 });
  const [submittingReview, setSubmittingReview] = useState(false);

  const totalPrice = tour?.price ? numPeople * tour.price : 0;

  // Load tour
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`${BASE}/tours/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Không tìm thấy tour");
        return res.json();
      })
      .then((data) => {
        if (!data || (!data.id && !data._id)) {
          setError("Không tìm thấy tour này.");
          setTour(null);
        } else {
          setTour({
            ...data,
            id: data.id ?? data._id?.toString(),
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Không tải được tour này.");
        setTour(null);
        setLoading(false);
      });

    // Lấy user từ localStorage
    const userInfo = localStorage.getItem("user_info");
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
  }, [id]);

  // Load reviews của tour
  useEffect(() => {
    if (!id) return;
    setReviewLoading(true);
    fetch(`${BASE}/reviews?tour=${id}`)
      .then(res => res.json())
      .then(data => setReviews(data))
      .catch(() => setReviews([]))
      .finally(() => setReviewLoading(false));
  }, [id]);

  // Đặt tour
  const handleBooking = () => {
    if (!user) {
      alert("Vui lòng đăng nhập trước khi đặt tour.");
      router.push("/login");
      return;
    }
    setShowModal(true);
  };

  // Xác nhận đặt tour
  const handleConfirmBooking = async () => {
    if (!tour || !user) return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("⚠️ Bạn chưa đăng nhập.");
      return;
    }
    const bookingData = {
      user: String(user._id),
      tour: String(tour._id),
      num_people: numPeople,
      total_price: totalPrice,
      status: "pending",
    };

    const url = `${BASE}/booking`;
    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    };

    try {
      const res = await fetch(url, options);
      let data: any;
      try {
        data = await res.json();
      } catch {
        data = await res.text();
      }
      if (res.ok) {
        alert("✅ Đặt tour thành công!");
        setShowModal(false);
      } else {
        alert(data.message || data || "Lỗi khi tạo booking");
      }
    } catch (err) {
      alert("Lỗi mạng, thử lại sau.");
    }
  };

  // Gửi đánh giá mới
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Bạn cần đăng nhập để gửi đánh giá!");
      return;
    }
    if (!newReview.content.trim()) {
      alert("Vui lòng nhập nội dung bình luận!");
      return;
    }
    setSubmittingReview(true);
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${BASE}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user: user._id,
        tour: id,
        content: newReview.content,
        rating: newReview.rating,
      }),
    });
    setSubmittingReview(false);
    if (res.ok) {
      setNewReview({ content: "", rating: 5 });
      // Reload reviews
      fetch(`${BASE}/reviews?tour=${id}`)
        .then((res) => res.json())
        .then((data) => setReviews(data || []));
      alert("Đã gửi đánh giá! Cảm ơn bạn.");
    } else {
      alert("Lỗi khi gửi đánh giá!");
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="animate-spin rounded-full border-4 border-sky-200 border-t-sky-600 h-10 w-10 inline-block mr-2"></span>
        Đang tải tour...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center min-h-[40vh] text-red-600 text-lg">{error}</div>
    );

  if (!tour)
    return (
      <div className="flex justify-center items-center min-h-[40vh] text-gray-500">Không tìm thấy tour.</div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4 relative">
      {/* Nút back */}
      <Button
        onClick={handleBack}
        className="absolute top-0 left-0 flex items-center gap-2 bg-sky-100 text-sky-700 hover:bg-sky-200 rounded-xl shadow px-4 py-2 mt-2 ml-2 z-20"
        variant="ghost"
      >
        <ArrowLeft size={18} />
        <span className="font-medium hidden sm:inline">Trang chủ</span>
      </Button>

      <h1 className="text-3xl font-bold text-center text-sky-800 mb-4">{tour.title}</h1>
      <img
        src={tour.image || "/images/default_imagetour.jpg"}
        alt={tour.title}
        className="rounded-xl shadow w-full h-80 object-cover border"
        onError={(e) => ((e.target as HTMLImageElement).src = "/images/default_imagetour.jpg")}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div>
          <div className="mb-2"><strong>Địa điểm:</strong> {tour.location || "Chưa có địa điểm"}</div>
          <div className="mb-2"><strong>Ngày bắt đầu:</strong> {tour.start_date ? new Date(tour.start_date).toLocaleDateString("vi-VN") : "—"}</div>
          <div className="mb-2"><strong>Ngày kết thúc:</strong> {tour.end_date ? new Date(tour.end_date).toLocaleDateString("vi-VN") : "—"}</div>
          <div className="mb-2"><strong>Sức chứa:</strong> {tour.capacity ?? 20}</div>
          <div className="mb-2"><strong>Giá:</strong> <span className="font-bold text-sky-700">{tour.price ? `${tour.price.toLocaleString()}₫` : "Liên hệ"}</span></div>
          <div className="mt-4">
            <label htmlFor="numPeople" className="font-medium mr-2">Số người đi:</label>
            <input
              type="number"
              min={1}
              max={tour.capacity ?? 100}
              id="numPeople"
              value={numPeople}
              onChange={e => setNumPeople(Number(e.target.value))}
              className="border rounded px-2 py-1 w-24 text-center"
              style={{ outline: "none" }}
            />
          </div>
          <div className="mt-2 font-semibold text-sky-700">
            Tổng tiền: {totalPrice.toLocaleString()}₫
          </div>
          <Button className="mt-6 bg-sky-600 hover:bg-sky-700 text-white rounded-lg px-6 py-2" onClick={handleBooking}>
            Đặt tour ngay
          </Button>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-5 border min-h-[180px]">
          <h2 className="text-xl font-semibold mb-2 text-sky-700">Mô tả chi tiết</h2>
          <div className="text-gray-700 whitespace-pre-line">{tour.description || "Chưa có mô tả."}</div>
        </div>
      </div>

      {/* Section Review */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 text-sky-800">Đánh giá từ khách hàng</h2>
        {/* Form gửi bình luận */}
        {user ? (
          <form
            className="flex flex-col gap-2 mb-6 bg-sky-50 rounded-xl p-4 shadow"
            onSubmit={handleSubmitReview}
          >
            <label className="flex items-center gap-2 font-medium">
              Đánh giá:
              <select
                className="border rounded px-2 py-1"
                value={newReview.rating}
                onChange={e => setNewReview(r => ({ ...r, rating: Number(e.target.value) }))}
              >
                {[5, 4, 3, 2, 1].map(n => (
                  <option key={n} value={n}>{n} ⭐</option>
                ))}
              </select>
            </label>
            <textarea
              className="border rounded p-2"
              placeholder="Viết cảm nhận, đánh giá của bạn về tour này..."
              value={newReview.content}
              onChange={e => setNewReview(r => ({ ...r, content: e.target.value }))}
              rows={2}
              required
            />
            <Button
              type="submit"
              className="bg-sky-600 text-white w-max px-6"
              disabled={submittingReview}
            >{submittingReview ? "Đang gửi..." : "Gửi đánh giá"}</Button>
          </form>
        ) : (
          <div className="mb-4 text-gray-500">
            <b>Bạn cần đăng nhập để gửi bình luận và đánh giá.</b>
          </div>
        )}

        {/* Danh sách review */}
        {reviewLoading ? (
          <div className="text-sky-600 text-center py-6">Đang tải đánh giá...</div>
        ) : reviews.length === 0 ? (
          <div className="text-gray-500 text-center">Chưa có đánh giá nào cho tour này.</div>
        ) : (
          <div className="space-y-5">
            {reviews.map((rv) => (
              <div key={rv._id} className="bg-white rounded-lg shadow border px-5 py-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sky-700">
                      {(typeof rv.user === "object" && rv.user?.name) ? rv.user.name : "Ẩn danh"}
                    </span>
                    <span className="text-gray-400 text-xs">• {rv.createdAt ? new Date(rv.createdAt).toLocaleString("vi-VN") : ""}</span>
                  </div>
                  <div className="mb-2 text-yellow-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < rv.rating ? "★" : "☆"}</span>
                    ))}
                  </div>
                  <div className="text-gray-700">{rv.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal xác nhận */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-30 ">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg relative">
            <h2 className="text-2xl font-bold text-center mb-3 text-green-700" >🎉 Cảm ơn bạn đã đặt tour!</h2>
            <div className="text-center text-gray-700 mb-2">
              Đơn đặt tour của bạn đã được tạo ở trạng thái <b>chờ xác nhận</b>.<br />
              Vui lòng <b>thanh toán bằng QR</b> và <b>liên hệ quản trị viên</b> nếu có vấn đề.
            </div>
            <div className="bg-sky-50 rounded-lg shadow-inner px-5 py-3 my-4 text-base">
              <div><b>Tên tour:</b> {tour?.title}</div>
              <div><b>Ngày bắt đầu:</b> {tour?.start_date ? new Date(tour.start_date).toLocaleDateString("vi-VN") : "--"}</div>
              <div><b>Ngày kết thúc:</b> {tour?.end_date ? new Date(tour.end_date).toLocaleDateString("vi-VN") : "--"}</div>
              <div><b>Số người:</b> {numPeople}</div>
              <div><b>Tổng tiền:</b> <span className="text-sky-700 font-semibold">{totalPrice.toLocaleString()}₫</span></div>
              <div><b>Người đặt:</b> {user?.name ?? "Ẩn danh"}</div>
            </div>
            <div className="flex flex-col items-center gap-1 mb-2">
              <div>SĐT người hỗ trợ: 0321343456</div>
              <span className="font-semibold mb-1">Quét mã QR để thanh toán:</span>
              <img
                src="/images/qr.jpg"
                alt="QR Thanh toán"
                className="w-48 h-48 object-contain rounded border"
                onError={e => (e.currentTarget.src = "/images/default_qr.jpg")}
              />
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <Button className="bg-green-600 text-white" onClick={handleConfirmBooking}>Xác nhận</Button>
              <Button className="bg-red-600 text-white" onClick={() => setShowModal(false)}>Hủy</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
