import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hahsmmtlljdsghqdbvcu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhaHNtbXRsbGpkc2docWRidmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTA0MTQsImV4cCI6MjA5NzcyNjQxNH0.MauqNwOGcN_KWghTGRrdCD5PPJYoJS0BWoE6Q-X9llk';

// Safe dummy client to prevent startup crashes when env vars are missing (e.g. in deployment)
const createDummyClient = () => {
  const chainable = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single'];
  methods.forEach(method => {
    chainable[method] = () => {
      const promise = Promise.resolve({ data: [], error: { message: 'Supabase not configured' } });
      Object.assign(promise, chainable);
      return promise;
    };
  });
  
  return {
    auth: {
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve(),
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
    },
    from: () => chainable
  };
};

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDummyClient();

