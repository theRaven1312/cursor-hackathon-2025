import bcrypt from 'bcryptjs';
import connectDB, { User, Photo, Comment } from './database.js';

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    console.log('🌱 Starting database seed...');

    // Clear existing data
    await User.deleteMany({});
    await Photo.deleteMany({});
    await Comment.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const demoUser = await User.create({
      username: 'demo_user',
      email: 'demo@geosnap.com',
      password: hashedPassword,
      avatar: null
    });
    console.log('✅ Created demo user (demo@geosnap.com / demo123)');

    // Create sample photos around Ho Chi Minh City
    const samplePhotos = [
      {
        user: demoUser._id,
        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCBmaWxsPSIjMWExYTJlIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn4+b77iPIEJlbiBUaGFuaCBNYXJrZXQ8L3RleHQ+PC9zdmc+',
        location: { lat: 10.7721, lng: 106.6980 },
        address: 'Chợ Bến Thành',
        rating: 5,
        caption: 'Khu chợ sầm uất nhất Sài Gòn! 🛒',
        likes: []
      },
      {
        user: demoUser._id,
        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCBmaWxsPSIjMTYyMTNlIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn4+X77iPIE5vdHJlIERhbWUgQ2F0aGVkcmFsPC90ZXh0Pjwvc3ZnPg==',
        location: { lat: 10.7798, lng: 106.6990 },
        address: 'Nhà thờ Đức Bà',
        rating: 5,
        caption: 'Kiến trúc tuyệt đẹp từ thời Pháp thuộc 🏛️',
        likes: []
      },
      {
        user: demoUser._id,
        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCBmaWxsPSIjMGYzNDYwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn4+iIEJpdGV4Y28gVG93ZXI8L3RleHQ+PC9zdmc+',
        location: { lat: 10.7716, lng: 106.7043 },
        address: 'Bitexco Tower',
        rating: 4,
        caption: 'Tòa nhà biểu tượng của thành phố 🌆',
        likes: []
      },
      {
        user: demoUser._id,
        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCBmaWxsPSIjMWEzYzQwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn4y0IEJ1aSBWaWVuIFN0cmVldDwvdGV4dD48L3N2Zz4=',
        location: { lat: 10.7678, lng: 106.6932 },
        address: 'Phố Tây Bùi Viện',
        rating: 4,
        caption: 'Cuộc sống về đêm sôi động! 🎉',
        likes: []
      },
      {
        user: demoUser._id,
        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCBmaWxsPSIjMjg0MDRkIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn4+bIEluZGVwZW5kZW5jZSBQYWxhY2U8L3RleHQ+PC9zdmc+',
        location: { lat: 10.7770, lng: 106.6953 },
        address: 'Dinh Độc Lập',
        rating: 5,
        caption: 'Di tích lịch sử quan trọng của Việt Nam 🇻🇳',
        likes: []
      }
    ];

    const photos = await Photo.insertMany(samplePhotos);
    console.log(`✅ Created ${photos.length} sample photos`);

    // Create sample comments
    const sampleComments = [
      { photo: photos[0]._id, user: demoUser._id, text: 'Nơi đây có đồ ăn ngon lắm! 😋' },
      { photo: photos[0]._id, user: demoUser._id, text: 'Nhớ mua quà về cho mọi người nha!' },
      { photo: photos[1]._id, user: demoUser._id, text: 'Kiến trúc Gothic quá đẹp ❤️' },
      { photo: photos[2]._id, user: demoUser._id, text: 'View từ tầng cao tuyệt vời!' },
      { photo: photos[3]._id, user: demoUser._id, text: 'Phố đi bộ vui quá!' }
    ];

    await Comment.insertMany(sampleComments);
    console.log(`✅ Created ${sampleComments.length} sample comments`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('Login credentials:');
    console.log('  Email: demo@geosnap.com');
    console.log('  Password: demo123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
