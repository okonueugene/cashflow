import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Card } from '@rneui/themed';
import { PieChart } from 'react-native-gifted-charts';

const Targets = ({ transactions, balance, targetSavings }) => {
    const [totalSavings, setTotalSavings] = useState(0);

    const isLoading = transactions.length === 0 || balance === null;

    useEffect(() => {
        if (transactions && transactions.length > 0) {
            calculateTotalSavings(transactions);
        }
    }, [transactions]);

    const calculateTotalSavings = (transactions) => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        const creditTransactions = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return (
                transactionDate.getMonth() === currentMonth &&
                transactionDate.getFullYear() === currentYear &&
                transaction.type === 'credit'
            );
        });

        const total = creditTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
        setTotalSavings(total);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
        }).format(amount);
    };

    // Calculate progress (total savings vs target savings) and adjust PieChart values
    const progress = Math.min(totalSavings / targetSavings, 1);
    const chartData = [
        { value: progress * 100, color: '#4caf50', text: formatCurrency(totalSavings) }, // Savings amount
        { value: (1 - progress) * 100, color: '#f44336', text: formatCurrency(targetSavings - totalSavings) }, // Remaining to reach target
    ];

    const targetSavingsPerDay = targetSavings / 30;
    const currentDate = new Date();
    const dayOfMonth = currentDate.getDate();
    const expectedSavingsByNow = targetSavingsPerDay * dayOfMonth;

    // Function to determine the progress bar color
    const getProgressBarColor = (progress) => {
        if (progress <= 0.25) return '#f44336';  // Red
        if (progress <= 0.5) return '#ffeb3b';   // Yellow
        if (progress <= 0.75) return '#ff9800';  // Orange
        if (progress > 0.9) return '#4caf50';    // Green
        return '#2196f3';  // Blue for between 75% and 90%
    };

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Tabulating Target Savings...</Text>
            </View>
        );
    }

    return (
        <Card containerStyle={styles.card}>
            <Card.Title style={styles.cardTitle}>Target Savings Analysis</Card.Title>
            <View style={styles.container}>
                <Text style={styles.totalLabel}>
                    Current Balance: {balance !== null ? formatCurrency(balance) : 'N/A'}
                </Text>
                <Text style={styles.totalLabel}>
                    Expected Savings by Now: {expectedSavingsByNow > 0 ? formatCurrency(expectedSavingsByNow) : 'N/A'}
                </Text>
                <Text style={styles.totalLabel}>
                    Daily Savings Target: {targetSavingsPerDay > 0 ? formatCurrency(targetSavingsPerDay) : 'N/A'}
                </Text>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                    <View
                        style={[
                            styles.progressBar,
                            {
                                width: `${(progress * 100).toFixed(2)}%`,
                                backgroundColor: getProgressBarColor(progress),
                            },
                        ]}
                    />
                </View>
                <Text style={styles.progressLabel}>{`Progress: ${(progress * 100).toFixed(2)}%`}</Text>

                <View style={styles.chartContainer}>
                    <PieChart
                        data={chartData}
                        donut
                        showGradient
                        sectionAutoFocus
                        radius={90}
                        innerRadius={60}
                        innerCircleColor={'#232B5D'}
                        centerLabelComponent={() => (
                            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={styles.chartProgressText}>{`${(progress * 100).toFixed(2)}%`}</Text>
                                <Text style={styles.chartSubText}>{progress >= 95 ? 'Target Met!' : 'On Track'}</Text>
                            </View>
                        )}
                    />
                </View>

            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 20,
        flex: 1,
    },
    card: {
        marginTop: 12,
        borderRadius: 15,
        backgroundColor: '#f8f9fa',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    totalLabel: {
        fontSize: 14,
        marginBottom: 5,
        color: '#333',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 30,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: 'gray',
    },
    progressBarContainer: {
        width: '100%',
        height: 10,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
        overflow: 'hidden',
        marginVertical: 10,
    },
    progressBar: {
        height: '100%',
        borderRadius: 5,
    },
    progressLabel: {
        fontSize: 14,
        marginTop: 5,
        color: '#333',
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginVertical: 20,
    },
    chartProgressText: {
        fontSize: 22,
        color: 'white',
        fontWeight: 'bold',
    },
    chartSubText: {
        fontSize: 14,
        color: 'white',
    },
});

export default Targets;




