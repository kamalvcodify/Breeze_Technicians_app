import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import styles from '../styles/TechnicianHeader.styles';

const DESKTOP_WIDTH = 900;
const CHEVRON_ANIMATION_MS = 160;

/**
 * components/TechnicianHeader.js
 * ----------------------------------------------------------------
 * Nav bar shown on every technician/admin screen.
 *
 * IMPORTANT: every top-level nav row (Home, My Assigned Work
 * Orders, Privacy Policy) is built from the SAME row component
 * (DesktopNavRow / MobileNavRow below), whether or not it has a
 * trailing expand icon. Previously "Home" was hand-built with a
 * slightly different structure than the other two rows, which is
 * why it looked inconsistent — now all three literally share one
 * definition, so their height/padding/type styling can't drift
 * apart again.
 *
 * The mobile drawer rows use a FIXED height (not minHeight) in
 * TechnicianHeader.styles.js, and the trailing +/- icon on "Home"
 * gets styles.mobileRowTrailing so it can't push that row taller
 * than "My Assigned Work Orders" / "Privacy Policy".
 * ----------------------------------------------------------------
 */
export default function TechnicianHeader({ navigation, activeRoute, isAdmin = false }) {
  const { width } = useWindowDimensions();
  const { email, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [homeMenuOpen, setHomeMenuOpen] = useState(false);

  const chevronRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(chevronRotation, {
      toValue: homeMenuOpen ? 1 : 0,
      duration: CHEVRON_ANIMATION_MS,
      useNativeDriver: true,
    }).start();
  }, [homeMenuOpen, chevronRotation]);

  const chevronStyle = {
    transform: [
      {
        rotate: chevronRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  const isDesktop = width >= DESKTOP_WIDTH;
  const canGoBack = !!navigation?.canGoBack?.();

  const goTo = (screen) => {
    setMobileMenuOpen(false);
    setHomeMenuOpen(false);
    navigation.navigate(screen);
  };

  const handleBack = () => {
    setMobileMenuOpen(false);
    setHomeMenuOpen(false);
    navigation.goBack();
  };

  const handleBrandPress = () => {
    if (!isAdmin) {
      goTo('TechnicianHome');
    }
  };

  // Peek submenu under Home. "Submit Work Order" is listed here too
  // (in addition to being a card on the Home dashboard) so it's
  // reachable in one tap from the drawer without having to land on
  // Home first and then tap the card.
  const HomeMenu = ({ mobile = false }) => (
    <View style={mobile ? styles.mobileSubmenu : styles.desktopDropdown}>
      <MenuItem
        icon="clipboard-outline"
        label="Submit Work Order"
        onPress={() => goTo('SubmitWorkOrder')}
        mobile={mobile}
      />
      <MenuItem icon="time-outline" label="Check In / Check Out" disabled mobile={mobile} />
      <MenuItem icon="hammer-outline" label="Submit a Rehab Order" disabled mobile={mobile} />
      <MenuItem icon="exit-outline" label="Process a Move Out" disabled mobile={mobile} />
    </View>
  );

  // --- Shared row builders — used for EVERY top-level nav item ---------

  function DesktopNavRow({ label, active, onPress, trailing }) {
    return (
      <View style={[styles.navLink, active && styles.activeNavLink]}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
          <Text style={[styles.navLinkText, active && styles.activeNavLinkText]}>{label}</Text>
        </TouchableOpacity>
        {trailing}
      </View>
    );
  }

  function MobileNavRow({ label, onPress, trailing }) {
    return (
      <View style={styles.mobileParentLink}>
        <TouchableOpacity
          style={styles.mobileParentTextTouch}
          onPress={onPress}
          activeOpacity={0.75}
        >
          <Text style={styles.mobileParentText}>{label}</Text>
        </TouchableOpacity>
        {trailing}
      </View>
    );
  }

  const homeExpandTrailing = (mobile) => (
    <TouchableOpacity
      style={mobile ? styles.mobileRowTrailing : undefined}
      onPress={() => setHomeMenuOpen((value) => !value)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityLabel="Show more Home options"
    >
      {mobile ? (
        <Ionicons name={homeMenuOpen ? 'remove' : 'add'} size={20} color={colors.blue} />
      ) : (
        <Animated.View style={[styles.navChevronWrap, chevronStyle]}>
          <Ionicons name="chevron-down" size={16} color={colors.textOnDarkMuted} />
        </Animated.View>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.leftArea}>
          {canGoBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              accessibilityLabel="Go back"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={22} color={colors.textOnDark} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.brand} onPress={handleBrandPress} activeOpacity={isAdmin ? 1 : 0.7}>
            <View style={styles.logoMark}>
              <View style={[styles.building, styles.buildingLeft]} />
              <View style={[styles.building, styles.buildingCentre]} />
              <View style={[styles.building, styles.buildingRight]} />
            </View>

            <View>
              <Text style={styles.brandName}>BREEZE</Text>
              <Text style={styles.brandSubtext}>PROPERTY GROUP</Text>
            </View>
          </TouchableOpacity>
        </View>

        {isDesktop ? (
          <View style={styles.desktopArea}>
            {isAdmin ? (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.blue} />
                <Text style={styles.adminBadgeText}>Admin Panel</Text>
              </View>
            ) : (
              <View style={styles.desktopNavigation}>
                <View>
                  <DesktopNavRow
                    label="Home"
                    active={activeRoute === 'Home'}
                    onPress={() => goTo('TechnicianHome')}
                    trailing={homeExpandTrailing(false)}
                  />
                  {homeMenuOpen && <HomeMenu />}
                </View>

                <DesktopNavRow
                  label="My Assigned Work Orders"
                  active={activeRoute === 'MyAssignedWorkOrders'}
                  onPress={() => goTo('MyAssignedWorkOrders')}
                />

                <DesktopNavRow
                  label="Privacy Policy"
                  active={activeRoute === 'Privacy'}
                  onPress={() => goTo('PrivacyPolicy')}
                />
              </View>
            )}

            <View style={styles.accountArea}>
              <Text style={styles.accountEmail} numberOfLines={1}>
                {email}
              </Text>
              <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
                <Feather name="log-out" size={13} color={colors.textOnDark} />
                <Text style={styles.logoutButtonText}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMobileMenuOpen(true)}
            accessibilityLabel="Open menu"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="menu" size={30} color={colors.textOnDark} />
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={mobileMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMobileMenuOpen(false)}
      >
        <View style={styles.mobileModal}>
          <Pressable style={styles.mobileBackdrop} onPress={() => setMobileMenuOpen(false)} />

          <View style={styles.mobileDrawer}>
            <View style={[styles.mobileHeader, { paddingTop: insets.top + 10 }]}>
              <View>
                <Text style={styles.mobileTitle}>Breeze Technician</Text>
                <Text style={styles.mobileEmail} numberOfLines={1}>
                  {email}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setMobileMenuOpen(false)}
                accessibilityLabel="Close menu"
              >
                <Ionicons name="close" size={24} color={colors.textOnDark} />
              </TouchableOpacity>
            </View>

            {isAdmin ? (
              <View style={styles.mobileAdminBadgeRow}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.blue} />
                <Text style={styles.mobileAdminBadgeText}>Admin Panel</Text>
              </View>
            ) : (
              <>
                <MobileNavRow
                  label="Home"
                  onPress={() => goTo('TechnicianHome')}
                  trailing={homeExpandTrailing(true)}
                />
                {homeMenuOpen && <HomeMenu mobile />}

                <MobileNavRow
                  label="My Assigned Work Orders"
                  onPress={() => goTo('MyAssignedWorkOrders')}
                />

                <MobileNavRow label="Privacy Policy" onPress={() => goTo('PrivacyPolicy')} />
              </>
            )}

            <View style={styles.mobileFooter}>
              <TouchableOpacity
                style={styles.mobileLogoutButton}
                onPress={logout}
                activeOpacity={0.85}
              >
                <Feather name="log-out" size={15} color={colors.textOnDark} />
                <Text style={styles.mobileLogoutText}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function MenuItem({ icon, label, onPress, disabled = false, mobile = false }) {
  return (
    <TouchableOpacity
      style={mobile ? styles.mobileSubmenuItem : styles.dropdownItem}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {!!icon && (
        <Ionicons
          name={icon}
          size={17}
          color={disabled ? colors.textFaint : colors.blue}
          style={styles.dropdownIcon}
        />
      )}

      <Text
        style={[
          mobile ? styles.mobileSubmenuText : styles.dropdownText,
          disabled && styles.disabledText,
        ]}
      >
        {label}
      </Text>

      {disabled && (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>SOON</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}