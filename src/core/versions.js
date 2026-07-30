const supportedVersions = [
    {
        id: '26.2',
        name: '26.2',
        type: 'release',
        label: 'Chaos Cubed',
        color: 'yellow',
        features: [
            { icon: 'fa-mountain', text: 'Sulfur Caves — biôm hang động mới với dải sulfur & cinnabar' },
            { icon: 'fa-cube', text: 'Sulfur Cube — mob hấp thụ khối và thay đổi tính chất vật lý' },
            { icon: 'fa-gem', text: 'Bộ khối Sulfur & Cinnabar mới (stairs, slab, wall, polished...)' },
            { icon: 'fa-fire', text: 'Potent Sulfur & Geyser — tạo khí độc và phun nước mạnh' },
            { icon: 'fa-users', text: 'Friends List chính thức + hỗ trợ Vulkan experimental' },
        ],
    },
    {
        id: '26.1.2',
        name: '26.1.2',
        type: 'release',
        label: 'Hotfix',
        color: 'gray',
        features: [
            { icon: 'fa-bug', text: 'Sửa lỗi Spectator mode tấn công được người chơi khác' },
            { icon: 'fa-check-square', text: 'Cải thiện tooltip của checkbox trong giao diện báo cáo' },
            { icon: 'fa-shield-alt', text: 'Tăng độ ổn định và vá lỗ hổng quan trọng' },
        ],
    },

    {
        id: '26.1.1',
        name: '26.1.1',
        type: 'release',
        label: 'Hotfix',
        color: 'gray',
        features: [
            { icon: 'fa-comment', text: 'Sửa lỗi không thể báo cáo tin nhắn chat (MC-307140)' },
            { icon: 'fa-users', text: 'Khôi phục chức năng báo cáo chat khi chat đang bật' },
            { icon: 'fa-bug', text: 'Hotfix nhỏ, tương thích với server 26.1' },
        ],
    },

    {
        id: '26.1',
        name: '26.1',
        type: 'release',
        label: 'Tiny Takeover',
        color: 'yellow',
        features: [
            { icon: 'fa-baby', text: 'Toàn bộ baby mob được làm lại model & texture dễ thương hơn' },
            { icon: 'fa-seedling', text: 'Golden Dandelion — dừng/tiếp tục quá trình lớn của baby mob' },
            { icon: 'fa-tag', text: 'Name Tag có thể chế tạo được từ giấy + bất kỳ nugget nào' },
            { icon: 'fa-music', text: 'Note Block đặt trên Copper Block phát âm thanh trumpet' },
            { icon: 'fa-code', text: 'Phiên bản đầu tiên yêu cầu Java 25 + format phiên bản mới YY.D' },
        ],
    },
    {
        id: '1.21.3',
        name: '1.21.3 (Latest)',
        type: 'release',
        label: 'Tricky Trials',
        color: 'green',
        features: [
            { icon: 'fa-khanda', text: 'Vũ khí mới: Mace, có thể kết hợp đòn rơi để gây sát thương diện rộng' },
            { icon: 'fa-dungeon', text: 'Trial Chambers — hầm ngục thử thách mới với Trial Spawner' },
            { icon: 'fa-ghost', text: 'Quái mới: Breeze, tấn công bằng gió và né đòn linh hoạt' },
            { icon: 'fa-box-archive', text: 'Vault Block — rương phần thưởng chỉ mở được một lần mỗi người chơi' },
            { icon: 'fa-wind', text: 'Wind Charge — vật phẩm đẩy bằng gió, dùng để di chuyển hoặc redstone' },
        ],
    },
    {
        id: '1.20.1',
        name: '1.20.1',
        type: 'release',
        label: 'Trails & Tales',
        color: 'pink',
        features: [
            { icon: 'fa-magnifying-glass', text: 'Khảo cổ học — đào Suspicious Sand/Gravel để tìm vật phẩm cổ' },
            { icon: 'fa-paw', text: 'Sniffer — sinh vật cổ đại nở từ trứng, tìm hạt giống cây đã tuyệt chủng' },
            { icon: 'fa-tree', text: 'Cherry Blossom Biome — rừng hoa anh đào với gỗ hồng đặc trưng' },
            { icon: 'fa-sign-hanging', text: 'Hanging Signs — biển treo mới cho trang trí xây dựng' },
            { icon: 'fa-horse', text: 'Camel — cưỡi được 2 người, nhảy cao trên địa hình gồ ghề' },
        ],
    },
    {
        id: '1.19.4',
        name: '1.19.4',
        type: 'release',
        label: 'The Wild Update',
        color: 'cyan',
        features: [
            { icon: 'fa-skull', text: 'Warden — quái vật mù nhưng cực nguy hiểm, dò theo rung động và âm thanh' },
            { icon: 'fa-water', text: 'Deep Dark & Ancient City — khu vực dưới lòng đất chứa chiến lợi phẩm hiếm' },
            { icon: 'fa-seedling', text: 'Mangrove Swamp — đầm lầy đước mới với gỗ và bùn (Mud) độc đáo' },
            { icon: 'fa-dove', text: 'Allay — sinh vật bay giúp nhặt vật phẩm theo yêu cầu' },
            { icon: 'fa-bell', text: 'Sculk Sensor & Shrieker — cơ chế redstone cảm biến rung động mới' },
        ],
    },
    {
        id: '1.18.2',
        name: '1.18.2',
        type: 'release',
        label: 'Caves & Cliffs Part II',
        color: 'orange',
        features: [
            { icon: 'fa-mountain', text: 'Thế giới sinh ra cao và sâu hơn hẳn, núi non hùng vĩ hơn' },
            { icon: 'fa-gem', text: 'Lush Caves & Dripstone Caves — hang động sinh thái mới lạ' },
            { icon: 'fa-layer-group', text: 'Phân bố quặng theo độ cao được thiết kế lại hoàn toàn' },
            { icon: 'fa-cloud', text: 'Giới hạn độ cao xây dựng tăng lên, bầu trời rộng hơn' },
            { icon: 'fa-compass', text: 'La bàn hiển thị độ cao (Y-level) ngay trên thanh F3' },
        ],
    },
];

module.exports = {
    getFeaturedVersions: function() {
        return supportedVersions;
    },

    getVersionList: function() {
        return supportedVersions;
    },
}