import type { Locale } from "./locale";

const vi = {
  nav: {
    home: "Trang chủ",
    office: "Virtual Office",
    workshop: "Xưởng sửa xe",
    lounge: "Phòng khách",
    renewal: "Quy trình gia hạn",
    claim: "Quy trình bồi thường",
    ops: "Ops",
    agent: "Telesales",
    compliance: "Compliance",
    metrics: "Metrics",
    admin: "Admin",
    workflow: "Workflow",
    menu: "Menu",
    close: "Đóng",
  },
  chrome: {
    signIn: "Đăng nhập với…",
    switch: "Đổi",
    reset: "Reset demo",
    signOut: "Đăng xuất",
    tour: "Tour",
    classic: "Classic",
    office: "Virtual Office",
    demoWatermark: "DEMO — SYNTHETIC",
  },
  home: {
    headline: "Khiến TNDS trở thành thứ tài xế muốn giữ",
    sub: "Demo gia hạn BeyondPilot — chấm điểm lead, chat AI, hoặc bước vào Virtual Office của Tasco.",
    enter: "Vào demo",
    continue: "Tiếp tục demo",
    workflow: "Sơ đồ workflow",
    sectionTitle: "Một hành trình, hai bề mặt khách hàng",
    sectionBody:
      "Classic Zalo / VETC cho gia hạn kiểu production — hoặc Virtual Office game HD-2D với CS AI, bồi thường ảnh, và theo dõi hồ sơ.",
    personaCustomer: "Khách hàng",
    personaCustomerBody: "Mặc định Virtual Office — Classic chat chỉ một nút chuyển.",
    personaOps: "Campaign ops",
    personaOpsBody: "Điểm số minh bạch, chiến dịch tôn trọng consent, funnel metrics.",
    personaVoice: "Voice + telesales",
    personaVoiceBody: "Voice có consent và bàn giao cho nhân viên.",
    signInPersona: "Đăng nhập theo persona",
    worlds: {
      title: "Ba không gian ảo",
      body: "Mỗi không gian là một thế giới 3D dùng chung — bạn sẽ thấy những người khác đang ở đó. Chat công khai chỉ mở trong phòng khách.",
      officeTitle: "Virtual Office",
      officeBody: "Bàn CS AI, bồi thường và bảng hồ sơ — toàn bộ hành trình gia hạn.",
      workshopTitle: "Xưởng sửa xe",
      workshopBody: "Hỏi AI về xe, kiểm tra tổng quan và khai báo bồi thường ngay tại chỗ.",
      loungeTitle: "Phòng khách",
      loungeBody: "Gặp gỡ và trò chuyện công khai với mọi người (có kiểm duyệt từ).",
      multiplayer: "Thấy người khác ngay trong không gian",
    },
  },
  login: {
    title: "Đăng nhập với…",
    subtitle:
      "Không mật khẩu — chọn persona. RBAC phía server vẫn khóa mọi màn hình, API và AI tool.",
    customerOffice: "Mở Virtual Office theo mặc định",
    continue: "Tiếp tục",
  },
  office: {
    loading: "Đang vào Virtual Office…",
  },
  chat: {
    title: "Chat gia hạn Zalo",
    subtitle: "Official Account + ZNS mô phỏng. Chỉ phí quy định — không giảm giá.",
    classic: "Classic chat",
    profileOk: "Hồ sơ OK",
    needsConfirm: "Cần xác nhận",
    openCheckout: "Mở thanh toán giả",
    vetcEntry: "Vào VETC App",
    virtualOffice: "Virtual Office",
    viewCert: "Xem giấy chứng nhận",
    placeholder: "Nhập tin nhắn…",
    send: "Gửi",
    chips: ["xác nhận", "cover", "thanh toán", "nhân viên"] as string[],
  },
  verify: {
    title: "Giấy chứng nhận TNDS điện tử",
    subtitle: "Chứng minh tức thì — không thể để quên ở nhà.",
    signInNeeded: "Đăng nhập để xác minh chứng nhận trong phiên demo.",
    signIn: "Đăng nhập",
    valid: "Hợp lệ",
    issued: "Phát hành",
    expires: "Hết hạn",
    premium: "Phí đã trả",
    insurer: "Công ty bảo hiểm",
  },
  vetc: {
    title: "Ứng dụng VETC",
    subtitle: "Cổng vào thứ hai tới cùng agent gia hạn.",
  },
  call: {
    title: "Cuộc gọi AI",
    subtitle: "Voice fallback khi khách không trả lời chat.",
  },
  ops: {
    title: "Lead scoring",
    subtitle:
      "Điểm số quy tắc minh bạch kèm next-best action. Chiến dịch tự loại khách không consent.",
  },
  agent: {
    title: "Bàn telesales",
    subtitle:
      "Handover ấm từ AI kèm tóm tắt. Gửi link gia hạn — khách tự xác nhận và thanh toán.",
  },
  compliance: {
    title: "Compliance",
    subtitle: "Sổ consent và audit log append-only. Chỉ đọc với persona này.",
  },
  metrics: {
    title: "Impact metrics",
    subtitle: "Funnel từ phiên demo cộng giả định cho phần pitch.",
  },
  admin: {
    title: "Admin",
    subtitle: "Nhà cung cấp AI, khóa, và quyền demo.",
  },
  workflow: {
    title: "Workflow visualizer",
    subtitle: "Sơ đồ quy trình gia hạn và vận hành.",
  },
  forbidden: {
    title: "Không có quyền",
    body: "Persona hiện tại không được phép mở màn hình này.",
    back: "Về trang chủ",
  },
  personaPill: {
    reset: "Reset demo",
    signOut: "Đăng xuất",
    switch: "Đổi",
  },
  welcome: {
    assumptionsTitle: "Ghi chú về giả định",
    guideTitle: "Bắt đầu ở đâu",
    guideTitleHint: "Đi qua các tính năng chính của ứng dụng này",
    role: {
      customer: "Khách hàng",
      telesales: "Telesales",
      campaign_manager: "Campaign manager",
      compliance: "Compliance",
      executive: "Lãnh đạo",
      admin: "Quản trị",
    },
    headline: {
      customer: "Chào mừng {name}",
      telesales: "Danh sách gọi hôm nay",
      campaign_manager: "Phòng điều khiển chiến dịch",
      compliance: "Phòng kiểm soát",
      executive: "Hiệu quả gia hạn",
      admin: "Phân tích ứng dụng",
    },
    sub: {
      customer:
        "Đây là tình trạng gia hạn TNDS của bạn và những gì bạn có thể làm tiếp theo.",
      telesales:
        "{caseload} lead được giao, {highValue} lead tiềm năng cao. Xử lý callback trước — những lead này hết hạn nhanh nhất.",
      campaign_manager:
        "{runs} chiến dịch đã chạy. Lần gần nhất tiếp cận {targeted} và giữ lại {excluded} theo quy tắc consent và điều kiện.",
      compliance:
        "Mọi hành động đặc quyền đều được ghi vào sổ kiểm toán bất biến. Không có gì trong phiên này bị sửa hoặc xóa.",
      executive:
        "Phễu gia hạn đang ở đâu trong phiên demo, và mức tăng mà pilot muốn chứng minh.",
      admin:
        "Bộ đếm trực tiếp cho bản demo này: hồ sơ đã xử lý, hợp đồng đã gia hạn và sổ kiểm toán đứng sau.",
    },
    section: {
      customer: { snapshot: "Hồ sơ của bạn", tasks: "Bạn có thể làm gì" },
      telesales: { snapshot: "KPI hôm nay", tasks: "Việc cần làm hôm nay" },
      campaign_manager: { snapshot: "Hiệu trạng chiến dịch", tasks: "Cần xem lại" },
      compliance: { snapshot: "Chỉ số kiểm soát", tasks: "Hàng đợi kiểm toán" },
      executive: { snapshot: "Phễu gia hạn", tasks: "Cần quyết định" },
      admin: { snapshot: "Số liệu ứng dụng", tasks: "Việc cần theo dõi" },
    },
    metrics: {
      customer: {
        status: "Trạng thái",
        policy: "Bảo hiểm",
        vehicle: "Phương tiện",
        certificate: "Giấy chứng nhận",
      },
      telesales: {
        renewals: "Gia hạn",
        premium: "Phí bảo hiểm",
        callbacks: "Chờ gọi lại",
        threads: "Hội thoại đang mở",
      },
      campaign_manager: {
        targeted: "Đã tiếp cận",
        excluded: "Bị loại",
        high: "Tiềm năng cao",
        medium: "Tiềm năng trung bình",
        low: "Tiềm năng thấp",
        renewalRate: "Tỷ lệ gia hạn",
      },
      compliance: {
        auditEvents: "Sự kiện kiểm toán",
        ledgerHealth: "Sổ kiểm toán",
        piiReveals: "Lần xem PII",
        claims: "Hồ sơ bồi thường",
        handovers: "Chuyển escalate",
      },
      executive: {
        scored: "Lead đã chấm",
        reminded: "Đã nhắc",
        engaged: "Đã tương tác",
        renewed: "Đã gia hạn",
        renewalRate: "Tỷ lệ gia hạn",
        premium: "Phí bảo hiểm",
        callbacks: "Yêu cầu gọi lại",
      },
      admin: {
        ticketsSolved: "Hồ sơ đã xử lý",
        renewed: "Hợp đồng đã gia hạn",
        premium: "Phí bảo hiểm",
        auditEvents: "Sự kiện kiểm toán",
        loungeMessages: "Tin nhắn phòng khách",
        piiReveals: "Lần xem PII",
        claimsResolved: "Bồi thường đã xử lý",
        escalations: "Escalate đã xử lý",
      },
    },
    hint: {
      customer: {
        status: "trạng thái hồ sơ",
        policy: "hạn hiệu lực",
        vehicle: "thông tin xe",
        certificate: "mã chứng nhận",
      },
      telesales: {
        renewals: "gia hạn / mục tiêu ngày",
        premium: "phí đã gia hạn",
        callbacks: "lead chờ gọi lại",
        threads: "hội thoại AI đang mở",
      },
      campaign_manager: {
        targeted: "tổng số lượt chạy",
        excluded: "bị chặn bởi consent và điều kiện",
        high: "tiềm năng cao",
        medium: "tiềm năng trung bình",
        low: "tiềm năng thấp",
        renewalRate: "đã gia hạn trên tổng lead",
      },
      compliance: {
        auditEvents: "sự kiện trong sổ",
        ledgerHealth: "chỉ ghi thêm, cắt bỏ cũ nhất",
        piiReveals: "lần xem có lý do",
        claims: "đã xử lý",
        handovers: "đang mở",
      },
      executive: {
        scored: "lead đã chấm điểm",
        reminded: "đã gửi nhắc",
        engaged: "đã phản hồi",
        renewed: "giấy chứng nhận đã cấp",
        renewalRate: "tỷ lệ quan sát được",
        premium: "phí đã gia hạn",
        callbacks: "yêu cầu gọi lại",
      },
      admin: {
        ticketsSolved: "hồ sơ đã xử lý",
        renewed: "hợp đồng đã gia hạn",
        premium: "phí đã gia hạn",
        auditEvents: "sự kiện kiểm toán",
        loungeMessages: "tin nhắn đã kiểm duyệt",
        piiReveals: "lần xem PII",
        claimsResolved: "hồ sơ đã xử lý",
        escalations: "escalate đã đóng",
      },
    },
    tasks: {
      customer: {
        addPolicy: "Khai báo hồ sơ bảo hiểm",
        completeVehicle: "Bổ sung thông tin xe còn thiếu",
        renewNow: "Gia hạn TNDS ngay",
        certIssued: "Giấy chứng nhận đã được cấp",
        visitOffice: "Ghé Virtual Office gặp nhân viên",
        visitWorkshop: "Ghé Xưởng sửa xe",
      },
      telesales: {
        callbacks: "Gọi lại lead đang chờ",
        openThreads: "Trả lời hội thoại AI đang mở",
        handover: "Hoàn tất bàn giao",
        dailyTarget: "Đạt mục tiêu gia hạn hôm nay",
      },
      campaign_manager: {
        reviewScores: "Xem lại lead tiềm năng cao",
        runCampaign: "Chạy chiến dịch nhắc gia hạn",
        chaseLapsed: "Xử lý hồ sơ đã rơi",
      },
      compliance: {
        reviewClaims: "Rà soát hồ sơ bồi thường thiếu thông tin",
        closeEscalations: "Đóng các ca chuyển escalate",
        auditTrail: "Kiểm tra sổ kiểm toán",
      },
      executive: {
        reviewFunnel: "Xem phễu gia hạn",
        reviewUpsell: "Đánh giá mức tăng",
        openOffice: "Tham quan Virtual Office",
      },
      admin: {
        reviewAudit: "Rà soát sổ kiểm toán",
        reviewClaims: "Rà soát hồ sơ bồi thường",
        moderation: "Kiểm duyệt tin nhắn phòng khách",
        workflow: "Chỉnh sửa workflow",
      },
    },
    actions: {
      customer: {
        openOffice: "Vào Virtual Office",
        openChat: "Trò chuyện với AI",
        openLounge: "Ghé Phòng khách",
      },
      telesales: { openAgent: "Mở màn hình Telesales", openWorkshop: "Ghé Xưởng sửa xe" },
      campaign_manager: { openOps: "Mở Ops", openMetrics: "Xem Metrics" },
      compliance: { openCompliance: "Mở Compliance", openMetrics: "Xem Metrics" },
      executive: { openMetrics: "Xem Metrics", openLounge: "Ghé Phòng khách" },
      admin: {
        openAdmin: "Mở trang quản trị",
        openCompliance: "Mở Compliance",
        openMetrics: "Xem Metrics",
      },
    },
    guide: {
      customer: {
        renewInChat:
          "Nhắn “gia hạn” trong khung chat — trợ lý sẽ dẫn bạn qua chấm điểm rủi ro, xin consent, rồi mới ra link thanh toán.",
        meetStaff:
          "Bước vào Virtual Office để nói chuyện trực tiếp với nhân viên, thay vì qua tin nhắn.",
        checkVehicle: "Ghé Xưởng sửa xe để xem kiểm tra xe của bạn đang ở bước nào.",
        switchLang:
          "Đổi VI / EN ở thanh bên — mọi màn hình đều theo, kể cả tin nhắn của trợ lý.",
      },
      telesales: {
        workQueue:
          "Bắt đầu ở hàng chờ bàn giao: mỗi hội thoại AI bỏ cuộc đều dừng lại đây kèm đầy đủ bối cảnh.",
        piiReason:
          "Mở thông tin định danh khách hàng phải ghi lý do, và lý do đó được ghi vào sổ kiểm toán.",
        renewLink: "Đóng hồ sơ bằng cách gửi link gia hạn — không cần gọi.",
        hearDrivers: "Vào Phòng khách để nghe khách hàng đang nói gì.",
      },
      campaign_manager: {
        reviewScores:
          "Lead được chấm điểm theo xu hướng gia hạn — mở danh sách để xem vì sao mỗi lead ở nhóm đó.",
        runCampaign: "Chạy chiến dịch và xem bộ lọc consent và điều kiện loại ai ra.",
        readFunnel: "Phễu cho biết khách đang dừng ở bước nào, nên canh thiếp ở đâu.",
        hearDrivers: "Ghé Phòng khách để đọc phản hồi thật, không chỉ số liệu.",
      },
      compliance: {
        readLedger: "Sổ kiểm toán chỉ ghi thêm. Mở mục kiểm toán để xem ai đã làm gì.",
        piiTrail: "Mỗi lần xem PII đều có lý do kèm theo — đây là danh sách các lý do đó.",
        tryAdmin:
          "Bạn chỉ có quyền đọc. Mở trang quản trị để xem hệ thống từ chối bạn như thế nào.",
        hearDrivers: "Phòng khách cho thấy khách đang viết gì — và kiểm duyệt diễn ra ở đó.",
      },
      executive: {
        readFunnel: "Phễu cho biết hiệu quả thật của kênh này, không phải con số minh hoạ.",
        seeUplift: "Tỷ lệ gia hạn được so với mức nền tự nguyện — phần chênh chính là mức tăng.",
        hearDrivers: "Phòng khách cho bạn nghe lý do khách chưa gia hạn.",
        watchDenied: "Bạn chỉ xem được số tổng hợp. Mở Compliance để xem quyền dừng ở đâu.",
      },
      admin: {
        permissionMatrix:
          "Bật hoặc tắt một quyền rồi đăng nhập lại persona đó — phản ứng có hiệu lực ngay.",
        moderation: "Kiểm duyệt tin nhắn trong Phòng khách trước khi hiển thị.",
        workflow: "Sơ đồ workflow là máy trạng thái thật, không phải hình minh hoạ.",
        walkOffice: "Vào Virtual Office để xem trải nghiệm phía khách hàng.",
      },
    },
    assumption: {
      telesales: {
        dailyTarget: "Mục tiêu {target} lượt gia hạn/ngày là con số minh hoạ của demo, không phải chỉ tiêu thật của Tasco.",
      },
      executive: {
        renewalBaseline:
          "Tỷ lệ gia hạn tự nguyện nền {baselinePct}% là giả định của demo, chờ dữ liệu kênh từ Tasco.",
      },
    },
  },
} as const;

const en = {
  nav: {
    home: "Home",
    office: "Virtual Office",
    workshop: "Workshop",
    lounge: "Lounge",
    renewal: "Renewal process",
    claim: "Claim process",
    ops: "Ops",
    agent: "Telesales",
    compliance: "Compliance",
    metrics: "Metrics",
    admin: "Admin",
    workflow: "Workflow",
    menu: "Menu",
    close: "Close",
  },
  chrome: {
    signIn: "Sign in as…",
    switch: "Switch",
    reset: "Reset demo",
    signOut: "Sign out",
    tour: "Tour",
    classic: "Classic",
    office: "Virtual Office",
    demoWatermark: "DEMO — SYNTHETIC",
  },
  home: {
    headline: "Make TNDS something drivers are glad to hold",
    sub: "BeyondPilot renewal demo — score the lead, renew in chat, or step into a Tasco Virtual Office.",
    enter: "Enter the demo",
    continue: "Continue demo",
    workflow: "Workflow map",
    sectionTitle: "One journey, two customer surfaces",
    sectionBody:
      "Classic Zalo / VETC for production-shaped renewal — or a game-like HD-2D Virtual Office with AI CS, claims photo upload, and admin tracking.",
    personaCustomer: "Customer",
    personaCustomerBody: "Virtual Office by default — Classic chat one toggle away.",
    personaOps: "Campaign ops",
    personaOpsBody: "Transparent scores, consent-safe campaigns, funnel metrics.",
    personaVoice: "Voice + telesales",
    personaVoiceBody: "Consent-aware voice fallback and human handover.",
    signInPersona: "Sign in as a persona",
    worlds: {
      title: "Three virtual spaces",
      body: "Each space is a shared 3D world — you can see who else is standing there. Public chat only happens in the Lounge.",
      officeTitle: "Virtual Office",
      officeBody: "AI service desk, claims and the case board — the full renewal journey.",
      workshopTitle: "Workshop",
      workshopBody: "Ask the AI about your car, get a walk-around inspection, and file a claim on the spot.",
      loungeTitle: "Lounge",
      loungeBody: "Meet and chat publicly with everyone else (moderated).",
      multiplayer: "See other people live, in every space",
    },
  },
  login: {
    title: "Sign in as…",
    subtitle:
      "No passwords — pick a persona. Server-side RBAC still enforces every screen, API, and AI tool.",
    customerOffice: "Opens in Virtual Office by default",
    continue: "Continue",
  },
  office: {
    loading: "Entering Virtual Office…",
  },
  chat: {
    title: "Zalo renewal chat",
    subtitle: "Simulated Official Account + ZNS. Regulated premium only — no discounts.",
    classic: "Classic chat",
    profileOk: "Profile OK",
    needsConfirm: "Needs confirmation",
    openCheckout: "Open mock checkout",
    vetcEntry: "VETC App entry",
    virtualOffice: "Virtual Office",
    viewCert: "View certificate",
    placeholder: "Type a message…",
    send: "Send",
    chips: ["confirm", "cover", "pay", "human"] as string[],
  },
  verify: {
    title: "Digital TNDS certificate",
    subtitle: "Instantly verifiable proof — impossible to leave at home.",
    signInNeeded: "Sign in to verify certificates from your demo session.",
    signIn: "Sign in",
    valid: "Valid",
    issued: "Issued",
    expires: "Expires",
    premium: "Premium paid",
    insurer: "Insurer",
  },
  vetc: {
    title: "VETC App",
    subtitle: "Second entry point into the same renewal agent.",
  },
  call: {
    title: "AI voice call",
    subtitle: "Voice fallback when the customer ignores chat.",
  },
  ops: {
    title: "Lead scoring",
    subtitle:
      "Transparent rule-based scores with next-best action. Campaigns auto-exclude customers without consent.",
  },
  agent: {
    title: "Telesales console",
    subtitle:
      "Warm AI handovers with summaries. Send a renewal link — customer confirms and pays themselves.",
  },
  compliance: {
    title: "Compliance",
    subtitle: "Consent ledger and append-only audit log. Read-only for this persona.",
  },
  metrics: {
    title: "Impact metrics",
    subtitle: "Funnel from this demo session plus stated assumptions for the pitch.",
  },
  admin: {
    title: "Admin",
    subtitle: "AI providers, keys, and demo permissions.",
  },
  workflow: {
    title: "Workflow visualizer",
    subtitle: "Map of the renewal and operations process.",
  },
  forbidden: {
    title: "Forbidden",
    body: "Your current persona is not allowed to open this screen.",
    back: "Back home",
  },
  personaPill: {
    reset: "Reset demo",
    signOut: "Sign out",
    switch: "Switch",
  },
  welcome: {
    assumptionsTitle: "Assumption notes",
    guideTitle: "Start here",
    guideTitleHint: "A walk through the main features of this app",
    role: {
      customer: "Customer",
      telesales: "Telesales",
      campaign_manager: "Campaign manager",
      compliance: "Compliance",
      executive: "Executive",
      admin: "Admin",
    },
    headline: {
      customer: "Welcome, {name}",
      telesales: "Today's call list",
      campaign_manager: "Campaign control room",
      compliance: "Control room",
      executive: "Renewal performance",
      admin: "Application analytics",
    },
    sub: {
      customer:
        "Here is where your TNDS renewal stands, and what you can do next.",
      telesales:
        "{caseload} leads assigned, {highValue} high propensity. Work the callbacks first — they expire fastest.",
      campaign_manager:
        "{runs} campaigns run. The last one reached {targeted} and held back {excluded} on consent and eligibility rules.",
      compliance:
        "Every privileged action is appended to an immutable ledger. Nothing in this session has been edited or deleted.",
      executive:
        "Where the renewal funnel stands in this demo session, and the uplift the pilot is built to claim.",
      admin:
        "Live counters for this demo instance: cases worked, policies renewed, and the audit trail behind them.",
    },
    section: {
      customer: { snapshot: "Your file", tasks: "What you can do" },
      telesales: { snapshot: "Today's KPI", tasks: "On your list today" },
      campaign_manager: { snapshot: "Campaign health", tasks: "Needs a look" },
      compliance: { snapshot: "Control metrics", tasks: "Audit queue" },
      executive: { snapshot: "Renewal funnel", tasks: "Decisions to make" },
      admin: { snapshot: "Application metrics", tasks: "Worth watching" },
    },
    metrics: {
      customer: {
        status: "Status",
        policy: "Policy",
        vehicle: "Vehicle",
        certificate: "Certificate",
      },
      telesales: {
        renewals: "Renewals",
        premium: "Premium",
        callbacks: "Awaiting callback",
        threads: "Open AI threads",
      },
      campaign_manager: {
        targeted: "Targeted",
        excluded: "Excluded",
        high: "High propensity",
        medium: "Medium propensity",
        low: "Low propensity",
        renewalRate: "Renewal rate",
      },
      compliance: {
        auditEvents: "Audit events",
        ledgerHealth: "Ledger",
        piiReveals: "PII reveals",
        claims: "Claims",
        handovers: "Escalations",
      },
      executive: {
        scored: "Leads scored",
        reminded: "Reminded",
        engaged: "Engaged",
        renewed: "Renewed",
        renewalRate: "Renewal rate",
        premium: "Premium",
        callbacks: "Callbacks requested",
      },
      admin: {
        ticketsSolved: "Cases worked",
        renewed: "Policies renewed",
        premium: "Premium",
        auditEvents: "Audit events",
        loungeMessages: "Lounge messages",
        piiReveals: "PII reveals",
        claimsResolved: "Claims resolved",
        escalations: "Escalations resolved",
      },
    },
    hint: {
      customer: {
        status: "renewal case",
        policy: "to expiry",
        vehicle: "vehicle details",
        certificate: "certificate id",
      },
      telesales: {
        renewals: "renewals vs daily target",
        premium: "premium renewed",
        callbacks: "leads waiting",
        threads: "open AI chats",
      },
      campaign_manager: {
        targeted: "across all runs",
        excluded: "blocked by consent + eligibility",
        high: "high propensity",
        medium: "medium propensity",
        low: "low propensity",
        renewalRate: "renewed of all leads",
      },
      compliance: {
        auditEvents: "events in the ledger",
        ledgerHealth: "append-only, oldest trimmed",
        piiReveals: "justified reveals",
        claims: "resolved",
        handovers: "still open",
      },
      executive: {
        scored: "leads scored",
        reminded: "reminders sent",
        engaged: "engaged",
        renewed: "certificates issued",
        renewalRate: "observed rate",
        premium: "premium renewed",
        callbacks: "callbacks requested",
      },
      admin: {
        ticketsSolved: "cases worked",
        renewed: "policies renewed",
        premium: "premium renewed",
        auditEvents: "audit events",
        loungeMessages: "moderated posts",
        piiReveals: "PII reveals",
        claimsResolved: "claims resolved",
        escalations: "escalations closed",
      },
    },
    tasks: {
      customer: {
        addPolicy: "Add your insurance policy",
        completeVehicle: "Finish the missing vehicle details",
        renewNow: "Renew TNDS now",
        certIssued: "Your certificate is issued",
        visitOffice: "Visit the Virtual Office",
        visitWorkshop: "Visit the Workshop",
      },
      telesales: {
        callbacks: "Call back the waiting leads",
        openThreads: "Answer the open AI threads",
        handover: "Close out the handovers",
        dailyTarget: "Hit today's renewal target",
      },
      campaign_manager: {
        reviewScores: "Review high-propensity leads",
        runCampaign: "Run the renewal reminder campaign",
        chaseLapsed: "Work the lapsed cases",
      },
      compliance: {
        reviewClaims: "Review claims needing information",
        closeEscalations: "Close open escalations",
        auditTrail: "Inspect the audit trail",
      },
      executive: {
        reviewFunnel: "Review the renewal funnel",
        reviewUpsell: "Assess the claimed uplift",
        openOffice: "Tour the Virtual Office",
      },
      admin: {
        reviewAudit: "Audit the ledger",
        reviewClaims: "Review claims",
        moderation: "Moderate lounge messages",
        workflow: "Edit the workflow",
      },
    },
    actions: {
      customer: {
        openOffice: "Enter the Virtual Office",
        openChat: "Chat with the AI",
        openLounge: "Visit the Lounge",
      },
      telesales: { openAgent: "Open Telesales console", openWorkshop: "Visit the Workshop" },
      campaign_manager: { openOps: "Open Ops", openMetrics: "View Metrics" },
      compliance: { openCompliance: "Open Compliance", openMetrics: "View Metrics" },
      executive: { openMetrics: "View Metrics", openLounge: "Visit the Lounge" },
      admin: {
        openAdmin: "Open admin console",
        openCompliance: "Open Compliance",
        openMetrics: "View Metrics",
      },
    },
    guide: {
      customer: {
        renewInChat:
          "Say “gia hạn” in chat — the agent walks you through risk scoring, asks for consent, then issues a payment link.",
        meetStaff:
          "Step into the Virtual Office to talk to a member of staff face to face instead of by message.",
        checkVehicle: "Visit the workshop to see where your vehicle inspection has got to.",
        switchLang:
          "Switch VI / EN in the sidebar — every screen follows, including the agent's replies.",
      },
      telesales: {
        workQueue:
          "Start with the handover queue: every AI thread that gave up lands here with its full context.",
        piiReason:
          "Revealing a customer's identity requires a reason, and that reason is written to the audit ledger.",
        renewLink: "Close a case by sending the renewal link — no call needed.",
        hearDrivers: "Open the Lounge to hear what drivers are actually saying.",
      },
      campaign_manager: {
        reviewScores:
          "Leads are scored on renewal propensity — open the list to see why each one landed where it did.",
        runCampaign:
          "Run a campaign and watch the consent and eligibility filters exclude people for you.",
        readFunnel: "The funnel shows where customers stall, so you know where to intervene.",
        hearDrivers: "Drop into the Lounge to read real replies instead of just the numbers.",
      },
      compliance: {
        readLedger: "The ledger is append-only. Open the audit view to see who did what.",
        piiTrail: "Every PII reveal carries a justification — this is the list of them.",
        tryAdmin:
          "You are read-only. Open the admin page to watch the system refuse you.",
        hearDrivers: "The Lounge shows what customers are writing — and where moderation happens.",
      },
      executive: {
        readFunnel:
          "The funnel shows the real performance of this channel, not a modelled number.",
        seeUplift:
          "The renewal rate is measured against the voluntary baseline — the gap is the uplift.",
        hearDrivers: "The Lounge tells you why customers did not renew.",
        watchDenied:
          "You see aggregates only. Open Compliance to see exactly where your access stops.",
      },
      admin: {
        permissionMatrix:
          "Toggle a permission, then sign back in as that persona — the change applies immediately.",
        moderation: "Moderate Lounge messages before they are shown.",
        workflow: "The workflow diagram is the real state machine, not an illustration.",
        walkOffice: "Walk into the Virtual Office to see the customer's side of it.",
      },
    },
    assumption: {
      telesales: {
        dailyTarget: "A {target} renewals/day target is a demo figure, not a Tasco quota.",
      },
      executive: {
        renewalBaseline:
          "A {baselinePct}% baseline voluntary renewal rate is a demo assumption pending Tasco channel data.",
      },
    },
  },
} as const;

type DeepStringify<T> = T extends string
  ? string
  : T extends readonly unknown[]
    ? string[]
    : T extends object
      ? { [K in keyof T]: DeepStringify<T[K]> }
      : T;

export type Dictionary = DeepStringify<typeof vi>;

export const dictionaries: Record<Locale, Dictionary> = { vi, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries.vi;
}
