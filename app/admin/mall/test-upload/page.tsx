// app/admin/mall/test-upload/page.tsx
// 파일 업로드 및 압축 다운로드 테스트 페이지

import FileUploader from '@/components/admin/mall/FileUploader';

export default function TestUploadPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          파일 압축 및 다운로드 테스트
        </h1>
        <p className="text-gray-600 mb-6">
          이미지, 영상, 압축 파일을 업로드하여 압축된 버전을 다운로드 받을 수 있습니다.
          홈페이지에 업로드할 때 용량을 절약할 수 있도록 최적화된 파일을 제공합니다.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">이미지 압축</h2>
            <FileUploader type="image" />
            <p className="text-xs text-gray-500 mt-2">
              • JPEG 형식으로 변환<br/>
              • 최대 1920px로 리사이징<br/>
              • 80% 품질로 압축<br/>
              • 용량 대폭 감소, 화질 유지
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">영상 처리</h2>
            <FileUploader type="video" />
            <p className="text-xs text-gray-500 mt-2">
              • 브라우저에서 제한적 처리<br/>
              • 완전한 압축은 서버 필요<br/>
              • 원본 파일 다운로드 가능
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">압축 파일</h2>
            <FileUploader type="font" />
            <p className="text-xs text-gray-500 mt-2">
              • 폰트 파일 지원<br/>
              • ZIP, RAR 등 압축 파일도 가능<br/>
              • 원본 그대로 다운로드
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">📝 사용 안내</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>이미지:</strong> JPEG, PNG, GIF, WebP 파일을 업로드하면 자동으로 압축되어 다운로드됩니다.</li>
            <li>• <strong>영상:</strong> 브라우저에서 완전한 압축은 어려우므로 원본 파일이 다운로드됩니다.</li>
            <li>• <strong>압축 파일:</strong> ZIP, RAR 등은 그대로 다운로드됩니다.</li>
            <li>• 압축된 파일은 홈페이지에 업로드할 때 용량을 절약할 수 있습니다.</li>
            <li>• 이미지는 화질이 너무 떨어지지 않도록 최적화되어 있습니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}










