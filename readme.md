# 🪷 Vastu Shanti RSVP Website

A beautiful and functional RSVP website for Vastu Shanti ceremony with MongoDB backend, featuring elegant Indian-inspired design and comprehensive admin dashboard.

## ✨ Features

### 🎨 Frontend
- **Elegant Design**: Beautiful gradient backgrounds with Indian cultural elements
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Interactive Forms**: Smooth animations and real-time validation
- **Cultural Elements**: Lotus symbols and traditional color schemes
- **Modern UX**: Floating animations, hover effects, and smooth transitions

### 🔧 Backend
- **MongoDB Integration**: Secure data storage with validation
- **Express.js Server**: RESTful API with proper error handling
- **Rate Limiting**: Protection against spam and abuse
- **Data Validation**: Phone number and input validation
- **Duplicate Prevention**: Prevents multiple RSVPs from same phone number

### 📊 Admin Dashboard
- **Real-time Statistics**: Total RSVPs, attending count, guest count
- **Advanced Filtering**: Filter by attendance status
- **Search Functionality**: Search by name or phone number
- **CSV Export**: Download RSVP data for external use
- **Responsive Design**: Mobile-friendly admin interface

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd vastu-shanti-rsvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/vastu-shanti-rsvp
   ```

4. **Start MongoDB**
   - For local MongoDB: `mongod`
   - For MongoDB Atlas: Use your connection string in `.env`

5. **Run the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   - Main RSVP form: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin

## 📁 Project Structure

```
vastu-shanti-rsvp/
├── public/
│   ├── index.html          # Main RSVP form
│   ├── admin.html          # Admin dashboard
│   └── styles.css          # Styling
├── server.js               # Express server
├── package.json            # Dependencies
├── .env                    # Environment variables
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## 🛠️ API Endpoints

### Public Endpoints
- `GET /` - Main RSVP form
- `GET /health` - Server health check
- `POST /api/rsvp` - Submit RSVP

### Admin Endpoints
- `GET /admin` - Admin dashboard
- `GET /api/rsvps` - Get all RSVPs with statistics
- `GET /api/stats` - Get summary statistics
- `GET /api/test-db` - Test database connection

## 📋 RSVP Data Structure

```javascript
{
  name: String,           // Full name (required)
  phone: String,          // Phone number (required, unique)
  attendance: String,     // 'yes' or 'no' (required)
  guestCount: Number,     // Number of guests (required if attending)
  submittedAt: Date,      // Submission timestamp
  ipAddress: String       // IP address for security
}
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Server-side validation for all inputs
- **Duplicate Prevention**: Phone number uniqueness enforcement
- **Error Handling**: Comprehensive error handling and logging
- **IP Tracking**: Track submission IP addresses

## 🎨 Customization

### Colors and Styling
The website uses a warm, Indian-inspired color palette:
- Primary: `#8b4513` (Saddle Brown)
- Secondary: `#d4af37` (Gold)
- Accent: `#ff6b35` (Orange Red)
- Background: Gradient from `#ffecd2` to `#ff8a80`

### Event Details
Update the event information in `public/index.html`:
- Date and time
- Address
- Event name
- Host information

## 📱 Mobile Optimization

The website is fully responsive with:
- Mobile-first design approach
- Touch-friendly interface
- Optimized font sizes and spacing
- Horizontal scrolling for admin tables

## 🚀 Deployment

### MongoDB Atlas Setup
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`

### Heroku Deployment
1. Create a Heroku app
2. Set environment variables
3. Deploy from Git
4. Connect to MongoDB Atlas

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vastu-shanti-rsvp
```

## 🔧 Development

### Running in Development Mode
```bash
npm run dev
```

### Testing Database Connection
Visit: http://localhost:3000/api/test-db

### Viewing Logs
The server provides detailed logging for:
- RSVP submissions
- Database connections
- Error tracking
- Rate limiting

## 📊 Analytics and Monitoring

The admin dashboard provides:
- Real-time RSVP counts
- Attendance statistics
- Guest count tracking
- Submission timeline
- Export capabilities

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check if MongoDB is running
   - Verify connection string in `.env`
   - Check network connectivity

2. **Port Already in Use**
   - Change PORT in `.env`
   - Kill existing processes: `lsof -ti:3000 | xargs kill -9`

3. **RSVP Submission Fails**
   - Check browser console for errors
   - Verify server logs
   - Test database connection

### Debug Commands
```bash
# Test server health
curl http://localhost:3000/health

# Test database connection
curl http://localhost:3000/api/test-db

# Submit test RSVP
curl -X POST http://localhost:3000/api/rsvp \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","phone":"1234567890","attendance":"yes","guestCount":2}'
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions:
- Check the troubleshooting section
- Review server logs
- Test API endpoints manually
- Verify MongoDB connection

---

**Made with 🪷 for your special Vastu Shanti ceremony**