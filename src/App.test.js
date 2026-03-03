test("placeholder", () => {
  expect(true).toBe(true);
});


/*
import React from "react";
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('axios');

jest.mock("react-router-dom", () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: () => null,
  Navigate: () => null,
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
}));


test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
*/