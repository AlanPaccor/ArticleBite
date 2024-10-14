"use client";

import React, { useEffect, useState } from 'react';
import { Button, Container, Text, Flex } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';

export function CookiesBanner() {
  const [visible, setVisible] = useLocalStorage({ key: 'cookies-banner', defaultValue: true });
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-0 transition-opacity duration-600 ${fadeIn ? 'opacity-100' : 'opacity-0'} bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50 lg:w-[20vw] md:w-[35vw] lg:right-4 md:right-4 m-4 sm:bottom-0`}
    >
      <Container>
        <Flex justify="space-between" align="center" wrap="nowrap">
          <Text className="text-sm mr-2">
            This website uses cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
          </Text>
          <Button onClick={() => setVisible(false)} className="btn hover:bg-blue-700 text-white">
            I Agree
          </Button>
        </Flex>
      </Container>
    </div>
  );
}
