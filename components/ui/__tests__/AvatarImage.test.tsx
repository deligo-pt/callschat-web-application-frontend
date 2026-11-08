import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AvatarImage } from "../AvatarImage";

describe("AvatarImage", () => {
  it("renders deterministic initials when src is null or missing", () => {
    render(<AvatarImage alt="John Doe" size={48} />);
    const avatar = screen.getByLabelText("John Doe");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveTextContent("JD");
  });

  it("renders group icon when isGroup is true and src is null", () => {
    render(<AvatarImage alt="Design Team" size={48} isGroup={true} />);
    const groupAvatar = screen.getByLabelText("Design Team");
    expect(groupAvatar).toBeInTheDocument();
  });

  it("renders an image when valid src is provided", () => {
    render(
      <AvatarImage
        src="https://example.com/avatar.jpg"
        alt="Alice Cooper"
        size={40}
      />
    );
    const img = screen.getByRole("img", { name: "Alice Cooper" });
    expect(img).toBeInTheDocument();
  });

  it("falls back to initials when image load errors", () => {
    render(
      <AvatarImage
        src="https://example.com/broken.jpg"
        alt="Bob Marley"
        size={48}
      />
    );
    const img = screen.getByRole("img", { name: "Bob Marley" });
    fireEvent.error(img);

    const fallback = screen.getByLabelText("Bob Marley");
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent("BM");
  });
});

