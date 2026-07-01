// src/screens/user/SubscriptionScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { setPremiumStatus } from '../../store/slices/authSlice';
import { useAppTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Plan {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  duration: string;
  savings?: string;
  isPopular?: boolean;
  tagline: string;
  durationLabel: string;
}

export const SubscriptionScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { isDark } = useAppTheme();
  const { user } = useSelector((state: RootState) => state.auth);

  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'bkash' | 'nagad' | 'rocket' | null>(null);
  
  // Payment steps: 'gateway' | 'phone' | 'otp' | 'pin' | 'processing' | 'success'
  const [paymentStep, setPaymentStep] = useState<'gateway' | 'phone' | 'otp' | 'pin' | 'processing' | 'success'>('gateway');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [pinNumber, setPinNumber] = useState('');
  const [gatewayLoading, setGatewayLoading] = useState(false);

  const plans: Plan[] = [
    {
      id: 'monthly',
      title: 'মাসিক মেম্বারশিপ',
      price: '৳৯৯',
      duration: '১ মাস মেয়াদী',
      durationLabel: 'মাস',
      isPopular: false,
      tagline: 'শর্ট-টার্ম ট্রায়াল ও রিভিশন',
    },
    {
      id: 'yearly',
      title: 'বাৎসরিক মেম্বারশিপ',
      price: '৳৪৯৯',
      originalPrice: '৳১,১৯০',
      duration: '১২ মাস মেয়াদী',
      durationLabel: 'বছর',
      savings: '৬০% সাশ্রয়',
      isPopular: true,
      tagline: 'সিলেবাস শেষ করার সেরা সাশ্রয়ী প্ল্যান',
    },
    {
      id: 'lifetime',
      title: 'আজীবন মেম্বারশিপ',
      price: '৳৯৯৯',
      originalPrice: '৳১,৯৯৯',
      duration: 'আজীবন অ্যাক্সেস',
      durationLabel: 'আজীবন',
      savings: '৫০% সাশ্রয়',
      isPopular: false,
      tagline: 'একবার পেমেন্ট, আজীবন সীমাহীন ব্যবহার',
    },
  ];

  const getPlanDetails = () => plans.find(p => p.id === selectedPlan) || plans[1];

  const handleStartPayment = () => {
    if (user?.is_premium) {
      Alert.alert('ইতিমধ্যে প্রিমিয়াম!', 'আপনার অ্যাকাউন্ট ইতিমধ্যে প্রিমিয়াম ক্যাটাগরিতে সচল রয়েছে।');
      return;
    }
    setPaymentStep('gateway');
    setPaymentModalVisible(true);
  };

  const handleSelectGateway = (gateway: 'bkash' | 'nagad' | 'rocket') => {
    setSelectedGateway(gateway);
    setPhoneNumber(user?.phone || '');
    setPaymentStep('phone');
  };

  const handlePhoneSubmit = () => {
    if (phoneNumber.length < 11) {
      Alert.alert('ভুল নম্বর', 'অনুগ্রহ করে ১১ ডিজিটের সঠিক মোবাইল নম্বরটি লিখুন।');
      return;
    }
    setGatewayLoading(true);
    setTimeout(() => {
      setGatewayLoading(false);
      setPaymentStep('otp');
    }, 1200);
  };

  const handleOtpSubmit = () => {
    if (otpCode.length < 6) {
      Alert.alert('ভুল ওটিপি (OTP)', 'অনুগ্রহ করে ৬ ডিজিটের ওটিপি নম্বরটি লিখুন।');
      return;
    }
    setGatewayLoading(true);
    setTimeout(() => {
      setGatewayLoading(false);
      setPaymentStep('pin');
    }, 1000);
  };

  const handlePinSubmit = () => {
    if (pinNumber.length < 4) {
      Alert.alert('ভুল পিন (PIN)', 'সঠিক পিন কোড প্রবেশ করান।');
      return;
    }
    setPaymentStep('processing');
    
    setTimeout(() => {
      dispatch(setPremiumStatus(true));
      setPaymentStep('success');
    }, 2500);
  };

  const handleClosePayment = () => {
    setPaymentModalVisible(false);
    setSelectedGateway(null);
    setPhoneNumber('');
    setOtpCode('');
    setPinNumber('');
    if (paymentStep === 'success') {
      navigation.goBack();
    }
  };

  const getGatewayTheme = () => {
    switch (selectedGateway) {
      case 'bkash':
        return { color: '#E2125B', name: 'bKash Checkout' };
      case 'nagad':
        return { color: '#F57C23', name: 'Nagad Checkout' };
      case 'rocket':
        return { color: '#8C3494', name: 'Rocket Checkout' };
      default:
        return { color: '#7c3aed', name: 'Checkout' };
    }
  };

  const activeTheme = {
    bg: isDark ? '#0f172a' : '#f8fafc',
    cardBg: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    subText: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeTheme.bg }]} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar backgroundColor={isDark ? "#0f172a" : "#ffffff"} barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header Bar */}
      <View style={[styles.header, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
        >
          <Ionicons name="arrow-back" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeTheme.text }]}>প্রিমিয়াম মেম্বারশিপ</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Main Content Scroll */}
      <ScrollView 
        style={styles.scroll} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Banner Card */}
        <LinearGradient
          colors={['#7c3aed', '#6d28d9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerHeader}>
            <Ionicons name="ribbon-sharp" size={20} color="#fbbf24" style={styles.bannerIcon} />
            <Text style={styles.bannerTitle}>BCS PREPARATION PRO</Text>
          </View>
          <Text style={styles.bannerText}>
            পরীক্ষায় সফলতার জন্য আনলক করুন দেশের সেরা প্রিমিয়াম প্রশ্ন ব্যাংক ও ইন্টারঅ্যাক্টিভ মডেল টেস্ট!
          </Text>
        </LinearGradient>

        {/* Benefits Checklist */}
        <View style={[styles.benefitsCard, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}>
          <Text style={[styles.benefitsHeader, { color: activeTheme.text }]}>✨ প্রিমিয়াম মেম্বারশিপের সুবিধাসমূহ</Text>
          {[
            '২৫,০০০+ ব্যাখ্যাসহ প্রশ্ন ও নির্ভুল সলিউশন',
            'KaTeX সমীকরণ ও নিখুঁত ম্যাথ ফর্মুলা ভিউ',
            'টাইমড লাইভ মডেল টেস্ট ও মেধা তালিকা',
            'সম্পূর্ণ ইন্টারনেট সংযোগ ছাড়াই অফলাইন রিভিশন',
            'অ্যাডভান্সড প্রগ্রেস এনালাইসিস গ্রাফিক্যাল রিপোর্ট',
          ].map((benefit, i) => (
            <View key={i} style={styles.benefitRow}>
              <View style={styles.checkIconBg}>
                <Ionicons name="checkmark" size={12} color="#10b981" />
              </View>
              <Text style={[styles.benefitText, { color: isDark ? '#cbd5e1' : '#334155' }]}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Plan Section Label */}
        <Text style={[styles.sectionTitle, { color: activeTheme.subText }]}>💳 প্ল্যান নির্বাচন করুন</Text>

        {/* Vertical List of Plan Cards (Safe & Responsive Layout) */}
        <View style={styles.plansContainer}>
          {plans.map(plan => {
            const isSelected = selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.9}
                style={[
                  styles.planCard,
                  { 
                    backgroundColor: activeTheme.cardBg, 
                    borderColor: isSelected ? '#7c3aed' : activeTheme.border,
                    borderWidth: isSelected ? 2.5 : 1
                  }
                ]}
              >
                {/* Check circle */}
                <View style={[
                  styles.checkCircle, 
                  { borderColor: isSelected ? '#7c3aed' : '#94a3b8', backgroundColor: isSelected ? '#7c3aed' : 'transparent' }
                ]}>
                  {isSelected && <View style={styles.checkCircleActiveInner} />}
                </View>

                {/* Plan Content */}
                <View style={styles.planMiddle}>
                  <View style={styles.planHeaderRow}>
                    <Text style={[styles.planTitleText, { color: activeTheme.text }]}>{plan.title}</Text>
                    {plan.savings && (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>{plan.savings}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.planTagline, { color: activeTheme.subText }]}>{plan.tagline}</Text>
                </View>

                {/* Plan Price */}
                <View style={styles.planRight}>
                  <Text style={styles.planPriceText}>{plan.price}</Text>
                  {plan.originalPrice && (
                    <Text style={styles.planOriginalPrice}>{plan.originalPrice}</Text>
                  )}
                  <Text style={[styles.planDurationLabel, { color: activeTheme.subText }]}>{plan.duration}</Text>
                </View>

                {plan.isPopular && (
                  <View style={styles.popularTag}>
                    <Text style={styles.popularTagText}>সেরা ডিল</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Bottom Pricing & Checkout Panel */}
      <View style={[styles.bottomBar, { backgroundColor: activeTheme.cardBg, borderTopColor: activeTheme.border }]}>
        <View style={styles.bottomPriceContainer}>
          <Text style={[styles.bottomPriceLabel, { color: activeTheme.subText }]}>মোট পরিশোধ করুন</Text>
          <Text style={[styles.bottomPriceValue, { color: activeTheme.text }]}>
            {getPlanDetails().price} <Text style={{ fontSize: 10, fontWeight: '400' }}>/{getPlanDetails().durationLabel}</Text>
          </Text>
        </View>

        {user?.is_premium ? (
          <View style={styles.premiumActiveBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" style={{ marginRight: 4 }} />
            <Text style={styles.premiumActiveText}>সক্রিয়</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleStartPayment}
            activeOpacity={0.85}
            style={styles.upgradeButton}
          >
            <LinearGradient
              colors={['#7c3aed', '#6d28d9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeButtonGradient}
            >
              <Text style={styles.upgradeButtonText}>সাবস্ক্রিপশন সম্পন্ন করুন</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Gateway Checkout Sandbox Modal */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClosePayment}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: activeTheme.cardBg }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: activeTheme.border }]}>
              <Text style={[styles.modalHeaderTitle, { color: activeTheme.text }]}>
                {paymentStep === 'gateway' ? 'পেমেন্ট গেটওয়ে নির্বাচন' : `${selectedGateway?.toUpperCase()} পেমেন্ট গেটওয়ে`}
              </Text>
              <TouchableOpacity onPress={handleClosePayment} style={styles.modalCloseButton}>
                <Ionicons name="close" size={20} color={activeTheme.text} />
              </TouchableOpacity>
            </View>

            {/* Content Body */}
            <View style={styles.modalBody}>
              {paymentStep === 'gateway' && (
                <View style={styles.modalStepContainer}>
                  <Text style={[styles.modalStepSubtext, { color: activeTheme.subText }]}>
                    পেমেন্ট সম্পন্ন করার জন্য আপনার মোবাইল ওয়ালেটটি নির্বাচন করুন:
                  </Text>
                  
                  <View style={styles.gatewayList}>
                    {[
                      { id: 'bkash', name: 'বিকাশ পেমেন্ট (bKash)', color: '#E2125B', tag: 'বিকাশ' },
                      { id: 'nagad', name: 'নগদ পেমেন্ট (Nagad)', color: '#F57C23', tag: 'নগদ' },
                      { id: 'rocket', name: 'রকেট পেমেন্ট (Rocket)', color: '#8C3494', tag: 'রকেট' }
                    ].map((gateway) => (
                      <TouchableOpacity
                        key={gateway.id}
                        onPress={() => handleSelectGateway(gateway.id as any)}
                        activeOpacity={0.8}
                        style={[styles.gatewayItem, { borderColor: activeTheme.border }]}
                      >
                        <View style={styles.gatewayLeft}>
                          <View style={[styles.gatewayIndicator, { backgroundColor: gateway.color }]} />
                          <Text style={[styles.gatewayNameText, { color: activeTheme.text }]}>{gateway.name}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={activeTheme.subText} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {paymentStep === 'phone' && (
                <View style={styles.modalStepContainer}>
                  <Text style={[styles.modalStepSubtext, { color: activeTheme.subText }]}>
                    আপনার ১১ ডিজিটের {selectedGateway} মোবাইল নম্বরটি প্রবেশ করান:
                  </Text>
                  
                  <TextInput
                    style={[styles.modalInput, { borderColor: activeTheme.border, color: activeTheme.text, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                    placeholder="যেমনঃ 017XXXXXXXX"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    maxLength={11}
                  />

                  <View style={styles.modalButtonRow}>
                    <TouchableOpacity
                      onPress={() => setPaymentStep('gateway')}
                      style={[styles.modalSecondaryButton, { borderColor: activeTheme.border }]}
                    >
                      <Text style={[styles.modalSecondaryButtonText, { color: activeTheme.text }]}>পিছনে</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={handlePhoneSubmit}
                      disabled={gatewayLoading}
                      style={[styles.modalPrimaryButton, { backgroundColor: getGatewayTheme().color }]}
                    >
                      {gatewayLoading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={styles.modalPrimaryButtonText}>ওটিপি পাঠান</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {paymentStep === 'otp' && (
                <View style={styles.modalStepContainer}>
                  <Text style={[styles.modalStepSubtext, { color: activeTheme.subText }]}>
                    আপনার অ্যাকাউন্ট নম্বরে পাঠানো ৬-ডিজিট ওটিপি (OTP) প্রবেশ করান (পরীক্ষার জন্য ১২৩৪৫৬ দিন):
                  </Text>
                  
                  <TextInput
                    style={[styles.modalInput, { borderColor: activeTheme.border, color: activeTheme.text, backgroundColor: isDark ? '#0f172a' : '#f8fafc', letterSpacing: 8, textAlign: 'center' }]}
                    placeholder="123456"
                    placeholderTextColor="#94a3b8"
                    keyboardType="number-pad"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    maxLength={6}
                  />

                  <TouchableOpacity
                    onPress={handleOtpSubmit}
                    disabled={gatewayLoading}
                    style={[styles.modalFullPrimaryButton, { backgroundColor: getGatewayTheme().color }]}
                  >
                    {gatewayLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.modalPrimaryButtonText}>কোড ভেরিফাই করুন</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {paymentStep === 'pin' && (
                <View style={styles.modalStepContainer}>
                  <Text style={[styles.modalStepSubtext, { color: activeTheme.subText }]}>
                    পেমেন্ট নিশ্চিত করতে আপনার গোপন পিন (PIN) প্রবেশ করান (৪ ডিজিট):
                  </Text>
                  
                  <TextInput
                    style={[styles.modalInput, { borderColor: activeTheme.border, color: activeTheme.text, backgroundColor: isDark ? '#0f172a' : '#f8fafc', letterSpacing: 10, textAlign: 'center' }]}
                    placeholder="••••"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={true}
                    keyboardType="number-pad"
                    value={pinNumber}
                    onChangeText={setPinNumber}
                    maxLength={4}
                  />

                  <TouchableOpacity
                    onPress={handlePinSubmit}
                    style={styles.modalSuccessConfirmButton}
                  >
                    <Text style={styles.modalPrimaryButtonText}>পেমেন্ট নিশ্চিত করুন</Text>
                  </TouchableOpacity>
                </View>
              )}

              {paymentStep === 'processing' && (
                <View style={styles.modalProcessingContainer}>
                  <ActivityIndicator size="large" color="#7c3aed" />
                  <Text style={[styles.modalProcessingTitle, { color: activeTheme.text }]}>পেমেন্ট প্রসেসিং হচ্ছে...</Text>
                  <Text style={[styles.modalProcessingText, { color: activeTheme.subText }]}>
                    অনুগ্রহ করে অপেক্ষা করুন। এই স্ক্রিন থেকে পিছনে যাবেন না।
                  </Text>
                </View>
              )}

              {paymentStep === 'success' && (
                <View style={styles.modalSuccessContainer}>
                  <View style={styles.successIconOuter}>
                    <Ionicons name="checkmark-done" size={36} color="#10b981" />
                  </View>
                  <Text style={[styles.successTitle, { color: activeTheme.text }]}>পেমেন্ট সফল হয়েছে!</Text>
                  <Text style={[styles.successDesc, { color: activeTheme.subText }]}>
                    অভিনন্দন! আপনার অ্যাকাউন্ট সফলভাবে সক্রিয় করা হয়েছে। এখন আপনার বিসিএস প্রিপারেশনের সব প্রশ্ন ব্যাংক ও প্র্যাকটিস মডিউল আনলক করা হয়েছে।
                  </Text>

                  <TouchableOpacity
                    onPress={handleClosePayment}
                    style={styles.successButton}
                  >
                    <Text style={styles.successButtonText}>অধ্যয়ন শুরু করুন</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'NotoSansBengali',
    textAlign: 'center',
    flex: 1,
  },
  headerRightPlaceholder: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  banner: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bannerIcon: {
    marginRight: 8,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bannerText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontFamily: 'NotoSansBengali',
    lineHeight: 18,
  },
  benefitsCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  benefitsHeader: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'NotoSansBengali',
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIconBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b98115',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  benefitText: {
    fontSize: 11,
    fontFamily: 'NotoSansBengali',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'NotoSansBengali',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  plansContainer: {
    gap: 12,
  },
  planCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkCircleActiveInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#ffffff',
  },
  planMiddle: {
    flex: 1,
    marginRight: 8,
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  planTitleText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'NotoSansBengali',
    marginRight: 6,
  },
  savingsBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  savingsText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
    fontFamily: 'NotoSansBengali',
  },
  planTagline: {
    fontSize: 9,
    fontFamily: 'NotoSansBengali',
  },
  planRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  planPriceText: {
    color: '#7c3aed',
    fontSize: 15,
    fontWeight: '900',
  },
  planOriginalPrice: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    fontSize: 9,
    marginTop: 1,
  },
  planDurationLabel: {
    fontSize: 9,
    fontFamily: 'NotoSansBengali',
    marginTop: 1,
  },
  popularTag: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  popularTagText: {
    color: '#0f172a',
    fontSize: 8,
    fontWeight: '900',
    fontFamily: 'NotoSansBengali',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  bottomPriceContainer: {
    flexDirection: 'column',
  },
  bottomPriceLabel: {
    fontSize: 9,
    fontFamily: 'NotoSansBengali',
  },
  bottomPriceValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  premiumActiveBadge: {
    backgroundColor: '#10b98115',
    borderColor: '#10b98130',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumActiveText: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 12,
    fontFamily: 'NotoSansBengali',
  },
  upgradeButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'NotoSansBengali',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'NotoSansBengali',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalStepContainer: {
    paddingBottom: 16,
  },
  modalStepSubtext: {
    fontSize: 11,
    fontFamily: 'NotoSansBengali',
    lineHeight: 16,
    marginBottom: 16,
  },
  gatewayList: {
    gap: 10,
  },
  gatewayItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gatewayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gatewayIndicator: {
    width: 6,
    height: 18,
    borderRadius: 3,
    marginRight: 12,
  },
  gatewayNameText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'NotoSansBengali',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'NotoSansBengali',
    marginBottom: 16,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalSecondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  modalSecondaryButtonText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'NotoSansBengali',
  },
  modalPrimaryButton: {
    flex: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  modalPrimaryButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'NotoSansBengali',
  },
  modalFullPrimaryButton: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  modalSuccessConfirmButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  modalProcessingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalProcessingTitle: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'NotoSansBengali',
    marginTop: 16,
  },
  modalProcessingText: {
    fontSize: 10,
    fontFamily: 'NotoSansBengali',
    marginTop: 4,
  },
  modalSuccessContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  successIconOuter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b98110',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10b98120',
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '900',
    fontFamily: 'NotoSansBengali',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 10,
    fontFamily: 'NotoSansBengali',
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  successButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'NotoSansBengali',
  },
});

export default SubscriptionScreen;
