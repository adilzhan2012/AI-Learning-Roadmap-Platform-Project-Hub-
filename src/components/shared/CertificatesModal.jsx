import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, FileBadge, ExternalLink, Loader2, DownloadCloud } from 'lucide-react';
import { useLocale } from '../../i18n.js';
import { getUserAllCertificates, requestCourseCertificate } from '../../services/courseService.js';
import { auth } from '../../firebase.js';

export default function CertificatesModal({ isOpen, onClose }) {
  const locale = useLocale();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (isOpen && auth.currentUser) {
      setLoading(true);
      getUserAllCertificates(auth.currentUser.uid).then(certs => {
        if (mounted) {
          setCertificates(certs);
          setLoading(false);
        }
      });
    }
    return () => { mounted = false; };
  }, [isOpen]);

  // Handle ESC and safe body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = locale === 'ru' ? {
    title: 'Мои сертификаты',
    emptyTitle: 'Сертификатов пока нет',
    emptyText: 'Пройдите свой первый курс, чтобы получить сертификат.',
    loading: 'Загрузка...',
    view: 'Посмотреть PDF'
  } : {
    title: 'My Certificates',
    emptyTitle: 'No certificates yet',
    emptyText: 'Complete your first course to earn a certificate.',
    loading: 'Loading...',
    view: 'View PDF',
    generate: 'Generate PDF',
    generating: 'Generating...'
  };

  const handleCertificateClick = async (cert) => {
    if (cert.fileUrl) {
      window.open(cert.fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // PDF is missing, let's try to generate it on the fly
    setGeneratingId(cert.id);
    
    try {
      const result = await requestCourseCertificate(cert.courseId);
      if (result && result.fileUrl) {
        window.open(result.fileUrl, '_blank', 'noopener,noreferrer');
        // Update local state to include the new URL
        setCertificates(prev => prev.map(c => 
          c.id === cert.id ? { ...c, fileUrl: result.fileUrl } : c
        ));
      } else {
        throw new Error("No URL returned");
      }
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-surface border border-outline rounded-[24px] shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-outline flex items-center justify-between bg-surface-container/30 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Award className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-on-surface font-sans">{content.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-on-surface-variant">{content.loading}</p>
              </div>
            ) : certificates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 text-on-surface-variant">
                  <FileBadge className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-2">{content.emptyTitle}</h3>
                <p className="text-sm text-on-surface-variant max-w-sm">{content.emptyText}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map((cert) => (
                  <div 
                    key={cert.id}
                    onClick={() => generatingId !== cert.id && handleCertificateClick(cert)}
                    className={`group bg-surface-container/30 border border-outline hover:border-primary/50 rounded-[16px] p-4 flex flex-col transition-all cursor-pointer hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden ${generatingId === cert.id ? 'opacity-70 pointer-events-none' : ''}`}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                    
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-[12px] bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                        <FileBadge className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-on-surface truncate mb-1" title={cert.courseName}>
                          {cert.courseName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono">
                          <span>
                            {cert.issuedAt?.toDate 
                              ? cert.issuedAt.toDate().toLocaleDateString() 
                              : (cert.issuedAt?.seconds ? new Date(cert.issuedAt.seconds * 1000).toLocaleDateString() : (cert.issuedAt || 'Recent'))}
                          </span>
                          <span>•</span>
                          <span>{cert.modulesCount} modules</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-outline/50 flex items-center justify-between relative z-10">
                      <span className="text-xs font-mono text-on-surface-variant">ID: {cert.certId || cert.id}</span>
                      <div className="flex items-center gap-1 text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                        {generatingId === cert.id ? (
                          <>
                            <span>{content.generating}</span>
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </>
                        ) : cert.fileUrl ? (
                          <>
                            <span>{content.view}</span>
                            <ExternalLink className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <span>{content.generate}</span>
                            <DownloadCloud className="w-4 h-4" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
