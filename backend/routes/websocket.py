"""
WebSocket 상태 관리자
=====================
에이전트 상태 변경을 프론트엔드에 실시간 브로드캐스트합니다.
"""

import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["websocket"])


class ConnectionManager:
    """다중 WebSocket 클라이언트 관리"""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, event: str, data: Any = None):
        """모든 연결된 클라이언트에 이벤트 전송"""
        message = json.dumps({"event": event, "data": data}, ensure_ascii=False)
        disconnected = []
        for conn in self.active_connections:
            try:
                await conn.send_text(message)
            except Exception:
                disconnected.append(conn)
        for conn in disconnected:
            self.disconnect(conn)


# 싱글턴 매니저
manager = ConnectionManager()


@router.websocket("/ws/status")
async def websocket_endpoint(websocket: WebSocket):
    """프론트엔드 WebSocket 연결 엔드포인트"""
    await manager.connect(websocket)
    try:
        # 연결 유지 — 클라이언트 메시지 대기
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
