import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';

const Card = ({ title, subtitle, imageSource, onPress, style }) => {
  return (
    <View style={[styles.card, style]} onPress={onPress}>
      <Image source={imageSource} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>   

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',   

    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation:   
 3,
    marginBottom: 16,
    padding: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
});

export default Card;
