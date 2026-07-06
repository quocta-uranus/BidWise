'use client';

import { useCallback, useState } from 'react';
import {
  ApiFreelancerProfile,
  AssessmentQuestion,
  ProfileCompleteness,
  freelancerApi,
} from '@/lib/api/freelancer.api';
import { useFreelancer, type FreelancerProfile } from './useFreelancer';

function mapApiToProfile(api: ApiFreelancerProfile): FreelancerProfile {
  return {
    bio: api.bio,
    phone: api.phone,
    hourlyRate: api.hourlyRate,
    experience: api.experience,
    skills: api.skills,
    available: api.available,
    assessmentCompleted: api.assessmentCompleted,
    assessmentScore: api.assessmentScore != null ? Math.round(api.assessmentScore) : null,
    assessmentLevel: api.assessmentLevel ?? undefined,
    cv: api.cv
      ? {
          fileName: api.cv.fileName,
          fileSize: String(api.cv.fileSize ?? ''),
          uploadedAt: api.cv.uploadedAt,
        }
      : null,
    portfolio: (api.portfolio ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      desc: p.desc,
      link: p.link,
      fileName: p.fileName ?? undefined,
      fileSize: p.fileSize ?? undefined,
      fileUrl: p.fileUrl ?? undefined,
    })),
    certificates: (api.certificates ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      issuer: c.issuer,
      date: c.date,
      verifyLink: c.verifyLink,
      verified: c.verified,
    })),
    reputationMatrix: api.reputationMatrix,
  };
}

export function useFreelancerProfile() {
  const profile = useFreelancer((s) => s.profile);

  const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[]>([]);

  const applyApiProfile = useCallback(
    (api: ApiFreelancerProfile) => {
      useFreelancer.getState().setProfileFromApi(mapApiToProfile(api));
      setCompleteness(api.completeness ?? null);
    },
    [],
  );

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await freelancerApi.getProfile();
      applyApiProfile(res.data.data);
    } catch (e) {
      setError('Không thể tải hồ sơ. Kiểm tra backend đang chạy.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [applyApiProfile]);

  const runMutation = useCallback(
    async (fn: () => Promise<{ data: { data: ApiFreelancerProfile } }>) => {
      setSaving(true);
      setError(null);
      try {
        const res = await fn();
        const data = res.data.data;
        applyApiProfile(data);
        return data;
      } catch (e) {
        setError('Thao tác thất bại. Vui lòng thử lại.');
        console.error(e);
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [applyApiProfile],
  );

  const updateProfile = useCallback(
    (fields: Partial<FreelancerProfile>) =>
      runMutation(() =>
        freelancerApi.updateProfile({
          bio: fields.bio,
          phone: fields.phone,
          hourlyRate: fields.hourlyRate,
          experience: fields.experience,
          skills: fields.skills,
        }),
      ),
    [runMutation],
  );

  const addSkill = useCallback(
    async (skill: string) => {
      const trimmed = skill.trim();
      if (!trimmed || profile.skills.includes(trimmed)) return;
      await runMutation(() =>
        freelancerApi.updateProfile({ skills: [...profile.skills, trimmed] }),
      );
    },
    [profile.skills, runMutation],
  );

  const removeSkill = useCallback(
    async (skill: string) => {
      await runMutation(() =>
        freelancerApi.updateProfile({
          skills: profile.skills.filter((s) => s !== skill),
        }),
      );
    },
    [profile.skills, runMutation],
  );

  const addPortfolio = useCallback(
    (
      item: { title: string; desc?: string; link?: string; linkType?: string },
      file?: File,
    ) => runMutation(() => freelancerApi.addPortfolio(item, file)),
    [runMutation],
  );

  const removePortfolio = useCallback(
    (id: string) => runMutation(() => freelancerApi.deletePortfolio(id)),
    [runMutation],
  );

  const uploadCv = useCallback(
    (file: File) => runMutation(() => freelancerApi.uploadCv(file)),
    [runMutation],
  );

  const deleteCv = useCallback(
    () => runMutation(() => freelancerApi.deleteCv()),
    [runMutation],
  );

  const addCertificate = useCallback(
    (cert: { name: string; issuer: string; date: string; verifyLink: string }, image?: File) =>
      runMutation(() => freelancerApi.addCertificate(cert, image)),
    [runMutation],
  );

  const deleteCertificate = useCallback(
    (id: string) => runMutation(() => freelancerApi.deleteCertificate(id)),
    [runMutation],
  );

  const setAvailability = useCallback(
    (available: boolean) => runMutation(() => freelancerApi.setAvailable(available)),
    [runMutation],
  );

  const loadAssessmentQuestions = useCallback(async () => {
    const res = await freelancerApi.getAssessmentQuestions();
    setAssessmentQuestions(res.data.data.questions);
    return res.data.data.questions;
  }, []);

  const submitAssessment = useCallback(
    async (answers: Array<{ questionId: string; selectedIndex: number }>) => {
      setSaving(true);
      setError(null);
      try {
        const result = await freelancerApi.submitAssessment(answers);
        applyApiProfile(result.data.data.profile);
        return result.data.data;
      } catch (e) {
        setError('Nộp bài thất bại.');
        console.error(e);
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [applyApiProfile],
  );

  return {
    profile,
    completeness,
    loading,
    saving,
    error,
    assessmentQuestions,
    loadProfile,
    updateProfile,
    addSkill,
    removeSkill,
    addPortfolio,
    removePortfolio,
    uploadCv,
    deleteCv,
    addCertificate,
    deleteCertificate,
    setAvailability,
    loadAssessmentQuestions,
    submitAssessment,
  };
}
