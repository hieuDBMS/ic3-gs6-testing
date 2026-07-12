import { useState, useEffect } from "react";
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Award, ArrowLeft, Target, Clock, AlertTriangle, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const MockResultPage = () => {
  const { t } = useTranslation();
  const { attemptId } = useParams();
  const { user } = useAuth();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data, error } = await supabase
          .from('exam_attempts')
          .select('*')
          .eq('id', attemptId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setAttempt(data);
      } catch (err) {
        console.error('Error fetching mock result:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [attemptId, user.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 dark:text-slate-400 font-medium">{t('mockResult.loading')}</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 max-w-sm w-full mx-4">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">{t('mockResult.notFound.title')}</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6 text-sm">{t('mockResult.notFound.message')}</p>
          <Link to="/exam" className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">
            {t('mockResult.backToReview')}
          </Link>
        </div>
      </div>
    );
  }

  const score1000 = attempt.score_1000 || 0;
  const isPassed = score1000 >= 700;
  const minutes = Math.floor((attempt.time_spent_seconds || 0) / 60);
  const seconds = (attempt.time_spent_seconds || 0) % 60;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full">
        {/* Nav */}
        <Link to="/exam" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mb-8 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:shadow-sm transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          {t('mockResult.backToReview')}
        </Link>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 relative">
          
          {/* Header Banner */}
          <div className={`h-32 absolute top-0 left-0 right-0 ${isPassed ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-rose-400 to-red-500'}`} />

          <div className="relative pt-12 px-8 pb-10 flex flex-col items-center text-center">
            {/* Medal/Icon */}
            <div className={`w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center transform -translate-y-2 mb-4 border-4 ${isPassed ? 'border-emerald-100 dark:border-emerald-900/50' : 'border-rose-100 dark:border-rose-900/50'}`}>
              <Award className={`w-12 h-12 ${isPassed ? 'text-emerald-500' : 'text-rose-500'}`} />
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-2">
              {isPassed ? t('mockResult.passedTitle') : t('mockResult.failedTitle')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {t('mockResult.subtitle')}
            </p>

            {/* Score Ring */}
            <div className="mt-8 mb-6 relative">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle cx="96" cy="96" r="88" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="12" fill="none" />
                <circle 
                  cx="96" cy="96" r="88" 
                  className={`transition-all duration-1000 ease-out ${isPassed ? 'stroke-emerald-500' : 'stroke-rose-500'}`} 
                  strokeWidth="12" 
                  fill="none" 
                  strokeDasharray="552.92" 
                  strokeDashoffset={552.92 - (552.92 * score1000) / 1000} 
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-black ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>{score1000}</span>
                <span className="text-slate-400 dark:text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">/ 1000</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 justify-center mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{t('mockResult.stats.questionCount')}</span>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{attempt.total_questions}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 justify-center mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{t('mockResult.stats.time')}</span>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{minutes}p {seconds}s</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Link
                to="/exam"
                className="flex-1 py-3.5 px-6 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                {t('mockResult.homeLink')}
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
