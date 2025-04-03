import React, { useState, useEffect } from 'react';
import { Menu, Button, Affix } from 'antd';
import { 
  MenuOutlined,
  CloseOutlined
} from '@ant-design/icons';

const SectionNavigation = () => {
  const [activeSection, setActiveSection] = useState('intro');
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      
      // Get all section elements
      const introSection = document.getElementById('intro-section');
      const mintSection = document.getElementById('mint-section');
      const myItemsSection = document.getElementById('my-items-section');
      const gallerySection = document.getElementById('gallery-section');
      
      // Get positions with some buffer for better UX
      const introPos = introSection ? introSection.offsetTop - 100 : 0;
      const mintPos = mintSection ? mintSection.offsetTop - 100 : 0;
      const myItemsPos = myItemsSection ? myItemsSection.offsetTop - 100 : 0;
      const galleryPos = gallerySection ? gallerySection.offsetTop - 100 : 0;
      
      // Determine active section
      if (scrollPosition >= galleryPos) {
        setActiveSection('gallery');
      } else if (scrollPosition >= myItemsPos) {
        setActiveSection('my-items');
      } else if (scrollPosition >= mintPos) {
        setActiveSection('mint');
      } else {
        setActiveSection('intro');
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Close mobile menu if open
      setMobileMenuVisible(false);
      
      // Scroll to section with offset for header
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Menu items for both desktop and mobile
  const menuItems = [
    {
      key: 'intro',
      label: 'Intro',
      onClick: () => scrollToSection('intro-section')
    },
    {
      key: 'mint',
      label: 'Mint',
      onClick: () => scrollToSection('mint-section')
    },
    {
      key: 'my-items',
      label: 'My Items',
      onClick: () => scrollToSection('my-items-section')
    },
    {
      key: 'gallery',
      label: 'Gallery',
      onClick: () => scrollToSection('gallery-section')
    }
  ];

  // Mobile menu toggle
  const toggleMobileMenu = () => {
    setMobileMenuVisible(!mobileMenuVisible);
  };

  // Responsive design
  const isMobile = windowWidth <= 768;

  return (
    <Affix offsetTop={0}>
      <div style={{ 
        background: '#1a1a1a', 
        borderBottom: '1px solid #333',
        zIndex: 1000
      }}>
        {isMobile ? (
          // Mobile view
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px 16px'
          }}>
            <span style={{ 
              fontFamily: 'monospace', 
              fontSize: '18px', 
              color: '#26abd4',
              fontWeight: 'bold'
            }}>
              g4m3 0f l1f3
            </span>
            
            <Button 
              type="text"
              icon={mobileMenuVisible ? <CloseOutlined /> : <MenuOutlined />}
              onClick={toggleMobileMenu}
              style={{ color: '#26abd4' }}
            />
            
            {mobileMenuVisible && (
              <Menu
                mode="vertical"
                selectedKeys={[activeSection]}
                style={{ 
                  position: 'absolute',
                  top: '52px',
                  left: 0,
                  right: 0,
                  background: '#1a1a1a',
                  borderTop: '1px solid #333'
                }}
                items={menuItems}
              />
            )}
          </div>
        ) : (
          // Desktop view
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '0 20px'
          }}>
            <span style={{ 
              fontFamily: 'monospace', 
              fontSize: '22px', 
              padding: '14px 20px',
              color: '#26abd4',
              fontWeight: 'bold'
            }}>
              g4m3 0f l1f3
            </span>
            
            <Menu
              mode="horizontal"
              selectedKeys={[activeSection]}
              style={{ 
                background: 'transparent', 
                borderBottom: 'none',
                minWidth: '400px',
                fontSize: '16px',
                fontFamily: 'monospace'
              }}
              items={menuItems}
            />
          </div>
        )}
      </div>
    </Affix>
  );
};

export default SectionNavigation;