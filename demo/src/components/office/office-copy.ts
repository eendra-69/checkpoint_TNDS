export type OfficeLocale = "vi" | "en";

const copy = {
  vi: {
    loading: "Đang vào Virtual Office…",
    hintWalk: "WASD / phím mũi tên để đi · E để nói chuyện",
    hintNear: "Nhấn E / A để nói chuyện",
    touchA: "A",
    stations: {
      reception: {
        name: "Lễ tân",
        prompt: "Chào mừng đến Tasco Virtual Office",
        intro:
          "Chào anh/chị! Em là lễ tân Tasco. Hãy đi gặp CS để gia hạn, bàn bồi thường để khai báo, hoặc bảng Hồ sơ để theo dõi.",
      },
      cs: {
        name: "Tasco CS",
        prompt: "Nói chuyện với CS",
        intro: "Xin chào! Em là CS ảo của Tasco. Em có thể giúp gia hạn TNDS ngay tại đây.",
      },
      claims: {
        name: "Bồi thường",
        prompt: "Khai báo bồi thường",
        intro: "Anh/chị muốn khai báo bồi thường? Hãy tải ảnh xe và mô tả ngắn giúp em.",
      },
      admin: {
        name: "Hồ sơ",
        prompt: "Theo dõi hồ sơ",
        intro: "Đây là bảng theo dõi hồ sơ gia hạn và bồi thường của anh/chị.",
      },
      vetc: {
        name: "VETC",
        prompt: "Mở Classic VETC",
        intro: "Chuyển sang ứng dụng VETC (Classic)…",
      },
    },
    adminPanel: {
      title: "Bảng hồ sơ",
      subtitle: "Theo dõi hồ sơ · nhật ký nhiệm vụ",
      renewalPin: "Ghim · Gia hạn TNDS",
      certIssued: "Đã cấp giấy chứng nhận",
      continueCs: "Tiếp tục với CS",
      openClassic: "Mở Classic chat",
      viewCert: "Xem giấy chứng nhận",
      claimsPin: "Ghim · Bồi thường",
      noClaims: "Chưa có hồ sơ bồi thường.",
      addClaim: "Thêm ảnh bồi thường",
      consentPin: "Ghim · Danh sách consent",
      messaging: "Nhắn tin",
      calls: "Cuộc gọi",
      dataUse: "Sử dụng dữ liệu",
    },
  },
  en: {
    loading: "Entering Virtual Office…",
    hintWalk: "WASD / arrows to walk · E to talk",
    hintNear: "Press E / A to talk",
    touchA: "A",
    stations: {
      reception: {
        name: "Reception",
        prompt: "Welcome to Tasco Virtual Office",
        intro:
          "Welcome! I'm the Tasco receptionist. Visit CS to renew, Claims to file, or the Admin board to track your case.",
      },
      cs: {
        name: "Tasco CS",
        prompt: "Talk to CS",
        intro: "Hi! I'm Tasco's AI CS. I can help renew your TNDS right here.",
      },
      claims: {
        name: "Claims",
        prompt: "File a claim",
        intro: "Want to file a claim? Upload car photos and a short note.",
      },
      admin: {
        name: "Admin board",
        prompt: "Track your case",
        intro: "This board tracks your renewal and claims status.",
      },
      vetc: {
        name: "VETC",
        prompt: "Open Classic VETC",
        intro: "Opening Classic VETC…",
      },
    },
    adminPanel: {
      title: "Admin Board",
      subtitle: "Case tracking · quest log",
      renewalPin: "Pin · TNDS renewal",
      certIssued: "Certificate issued",
      continueCs: "Continue with CS",
      openClassic: "Open Classic chat",
      viewCert: "View certificate",
      claimsPin: "Pin · Claims",
      noClaims: "No claims yet.",
      addClaim: "Add claim photo",
      consentPin: "Pin · Consent checklist",
      messaging: "Messaging",
      calls: "Calls",
      dataUse: "Data use",
    },
  },
} as const;

export function officeCopy(locale: OfficeLocale = "vi") {
  return copy[locale] || copy.vi;
}
