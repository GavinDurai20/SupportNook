import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import Home from "../../src/pages/home/Home";

describe("Home", () => {
  beforeEach(() => {
    localStorage.clear();

    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the home page", () => {
    render(
      <Home
        onRoomCreated={vi.fn()}
        onRoomJoined={vi.fn()}
      />
    );

    expect(
      screen.getByText("SupportNook")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Solve problems")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Your name")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Room ID")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Enter workspace",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Create a new room",
      })
    ).toBeInTheDocument();
  });

  it("shows an error when creating a room without a name", async () => {
    const onRoomCreated = vi.fn();

    render(
      <Home
        onRoomCreated={onRoomCreated}
        onRoomJoined={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create a new room",
      })
    );

    expect(
      await screen.findByText(
        "Please enter your name."
      )
    ).toBeInTheDocument();

    expect(fetch).not.toHaveBeenCalled();
    expect(onRoomCreated).not.toHaveBeenCalled();
  });

  it("shows an error when joining without a room ID", async () => {
    const onRoomJoined = vi.fn();

    render(
      <Home
        onRoomCreated={vi.fn()}
        onRoomJoined={onRoomJoined}
      />
    );

    fireEvent.change(
      screen.getByLabelText("Your name"),
      {
        target: {
          value: "Gavin",
        },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Enter workspace",
      })
    );

    expect(
      await screen.findByText(
        "Please enter the room ID."
      )
    ).toBeInTheDocument();

    expect(fetch).not.toHaveBeenCalled();
    expect(onRoomJoined).not.toHaveBeenCalled();
  });

  it("creates a room successfully", async () => {
    const onRoomCreated = vi.fn();

    const room = {
      roomId: "ABC123",
      name: "Gavin's Workspace",
      participants: [],
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        room,
      }),
    });

    render(
      <Home
        onRoomCreated={onRoomCreated}
        onRoomJoined={vi.fn()}
      />
    );

    fireEvent.change(
      screen.getByLabelText("Your name"),
      {
        target: {
          value: "Gavin",
        },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create a new room",
      })
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/rooms"),
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Gavin's Workspace",
        }),
      })
    );

    await waitFor(() => {
      expect(onRoomCreated).toHaveBeenCalledWith(room);
    });

    expect(
      localStorage.getItem(
        "supportnook-username"
      )
    ).toBe("Gavin");

    expect(
      JSON.parse(
        localStorage.getItem(
          "supportnook-room"
        )
      )
    ).toEqual(room);
  });

  it("joins a room successfully and normalizes the room ID", async () => {
    const onRoomJoined = vi.fn();

    const room = {
      roomId: "ABC123",
      name: "Test Workspace",
      participants: [],
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        room,
      }),
    });

    render(
      <Home
        onRoomCreated={vi.fn()}
        onRoomJoined={onRoomJoined}
      />
    );

    fireEvent.change(
      screen.getByLabelText("Your name"),
      {
        target: {
          value: "Gavin",
        },
      }
    );

    fireEvent.change(
      screen.getByLabelText("Room ID"),
      {
        target: {
          value: "abc123",
        },
      }
    );

    expect(
      screen.getByLabelText("Room ID")
    ).toHaveValue("ABC123");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Enter workspace",
      })
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/rooms/ABC123"
      )
    );

    await waitFor(() => {
      expect(onRoomJoined).toHaveBeenCalledWith(room);
    });

    expect(
      localStorage.getItem(
        "supportnook-username"
      )
    ).toBe("Gavin");

    expect(
      JSON.parse(
        localStorage.getItem(
          "supportnook-room"
        )
      )
    ).toEqual(room);
  });
});