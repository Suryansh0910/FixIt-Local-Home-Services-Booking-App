import { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { providers } from "../../data/providers";


export default function DashboardScreen() {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalSpent: 0,
    mostUsedCategory: "None",
    completedBookings: 0
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = JSON.parse(await AsyncStorage.getItem("fixit_bookings")) || [];
      setBookings(data);
      calculateStats(data);
    } catch (error) {
      console.log("Error loading dashboard data:", error);
    }
  };

  const calculateStats = (bookingData) => {
    const totalBookings = bookingData.length;
    const completedBookings = bookingData.filter(b => b.status === "Completed").length;
    const totalSpent = bookingData.reduce((sum, b) => sum + (b.price || 0), 0);
    
    const categoryCount = {};
    bookingData.forEach((booking) => {
      const provider = providers.find((p) => p.id === booking.providerId);
      if (provider) {
        const category = provider.category;
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    });

    const mostUsedCategory = Object.keys(categoryCount).length > 0
      ? Object.keys(categoryCount).sort((a, b) => categoryCount[b] - categoryCount[a])[0]
      : "None";

    setStats({
      totalBookings,
      totalSpent,
      mostUsedCategory,
      completedBookings
    });
  };

  const StatCard = ({ title, value, color = "#3498db" }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Your service booking overview</Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            color="#3498db"
          />
          
          <StatCard
            title="Completed"
            value={stats.completedBookings}
            color="#27ae60"
          />
          
          <StatCard
            title="Total Spent"
            value={`₹${stats.totalSpent}`}
            color="#f39c12"
          />
          
          <StatCard
            title="Favorite Category"
            value={stats.mostUsedCategory}
            color="#e74c3c"
          />
        </View>

        {bookings.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {bookings.slice(-3).reverse().map((booking) => {
              const provider = providers.find(p => p.id === booking.providerId);
              return (
                <View key={booking.id} style={styles.activityItem}>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityProvider}>
                      {provider?.name || "Unknown Provider"}
                    </Text>
                    <Text style={styles.activityDate}>{booking.date}</Text>
                  </View>
                  <View style={[
                    styles.activityStatus,
                    { backgroundColor: getStatusColor(booking.status) }
                  ]}>
                    <Text style={styles.activityStatusText}>{booking.status}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStatusColor = (status) => {
  switch (status) {
    case "Requested": return "#f39c12";
    case "Confirmed": return "#27ae60";
    case "Cancelled": return "#e74c3c";
    case "Completed": return "#95a5a6";
    default: return "#7f8c8d";
  }
};
