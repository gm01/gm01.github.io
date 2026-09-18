'use strict';
const flows = {
  quick: { action: '수락 → 픽업 → 배송', complete: '직접 수령 서명 완료 확인', label: '퀵 배송' },
  driver: { action: '수락 → 운행 → 결제', complete: '콜 대기 화면 복귀 확인', label: '대리 운행' }
};
document.querySelectorAll('[data-flow]').forEach(button => {
  button.addEventListener('click', () => {
    const flow = flows[button.dataset.flow];
    document.querySelectorAll('[data-flow]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.getElementById('flow-action').textContent = flow.action;
    document.getElementById('flow-complete').textContent = flow.complete;
    document.getElementById('flow-announcement').textContent = `${flow.label} 검증 흐름: ${flow.action}, ${flow.complete}`;
  });
});
document.getElementById('print-button').addEventListener('click', () => window.print());
