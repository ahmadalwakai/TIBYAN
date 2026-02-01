"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import PremiumCard from "@/components/ui/PremiumCard";
import { toaster } from "@/components/ui/toaster";
import { Switch } from "@chakra-ui/react";
import { useLogout } from "@/lib/auth-client";

interface NotificationPrefs {
  email: boolean;
  announcements: boolean;
  community: boolean;
}

export default function MemberSettingsPage() {
  const logout = useLogout();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    email: true,
    announcements: true,
    community: true,
  });
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [requestingEmailChange, setRequestingEmailChange] = useState(false);
  const [requestingDelete, setRequestingDelete] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [emailChangeForm, setEmailChangeForm] = useState({
    newEmail: "",
    note: "",
  });
  const [deleteForm, setDeleteForm] = useState({
    reason: "",
  });

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const res = await fetch("/api/member/settings", { credentials: "include" });
        const json = await res.json();
        if (json.ok) {
          setPrefs(json.data.notificationPrefs);
        }
      } catch {
        // ignore
      } finally {
        setLoadingPrefs(false);
      }
    };

    loadPrefs();
  }, []);

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    try {
      const res = await fetch("/api/member/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
        credentials: "include",
      });
      const json = await res.json();
      if (json.ok) {
        toaster.success({ title: "تم تحديث الإشعارات" });
      } else {
        toaster.error({ title: json.error || "تعذر حفظ الإعدادات" });
      }
    } catch {
      toaster.error({ title: "حدث خطأ في الاتصال" });
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleChangePassword = async () => {
    setChangingPassword(true);
    try {
      const res = await fetch("/api/member/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
        credentials: "include",
      });
      const json = await res.json();
      if (json.ok) {
        toaster.success({ title: "تم تحديث كلمة المرور" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toaster.error({ title: json.error || "تعذر تحديث كلمة المرور" });
      }
    } catch {
      toaster.error({ title: "حدث خطأ في الاتصال" });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleEmailChangeRequest = async () => {
    setRequestingEmailChange(true);
    try {
      const res = await fetch("/api/member/settings/email-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailChangeForm),
        credentials: "include",
      });
      const json = await res.json();
      if (json.ok) {
        toaster.success({ title: "تم إرسال طلب تغيير البريد" });
        setEmailChangeForm({ newEmail: "", note: "" });
      } else {
        toaster.error({ title: json.error || "تعذر إرسال الطلب" });
      }
    } catch {
      toaster.error({ title: "حدث خطأ في الاتصال" });
    } finally {
      setRequestingEmailChange(false);
    }
  };

  const handleDeleteAccountRequest = async () => {
    setRequestingDelete(true);
    try {
      const res = await fetch("/api/member/settings/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deleteForm),
        credentials: "include",
      });
      const json = await res.json();
      if (json.ok) {
        toaster.success({ title: "تم إرسال طلب حذف الحساب" });
        setDeleteForm({ reason: "" });
      } else {
        toaster.error({ title: json.error || "تعذر إرسال الطلب" });
      }
    } catch {
      toaster.error({ title: "حدث خطأ في الاتصال" });
    } finally {
      setRequestingDelete(false);
    }
  };

  return (
    <Container maxW="4xl" px={{ base: 4, md: 6 }}>
      <Stack gap={6}>
        <Heading size="lg">إعدادات الحساب</Heading>

        <PremiumCard variant="elevated" p={{ base: 6, md: 8 }}>
          <Stack gap={4}>
            <Heading size="md">تغيير كلمة المرور</Heading>
            <Field label="كلمة المرور الحالية" required inputId="current-password">
              <Input
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              />
            </Field>
            <Field label="كلمة المرور الجديدة" required inputId="new-password">
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              />
            </Field>
            <Field label="تأكيد كلمة المرور" required inputId="confirm-password">
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </Field>
            <Button
              bg="primary"
              color="primaryText"
              onClick={handleChangePassword}
              disabled={changingPassword}
              loading={changingPassword}
            >
              تحديث كلمة المرور
            </Button>
          </Stack>
        </PremiumCard>

        <PremiumCard variant="elevated" p={{ base: 6, md: 8 }}>
          <Stack gap={4}>
            <Heading size="md">تفضيلات الإشعارات</Heading>
            {loadingPrefs ? (
              <Text color="muted">جاري التحميل...</Text>
            ) : (
              <Stack gap={3}>
                <Switch.Root
                  checked={prefs.email}
                  onCheckedChange={(details) => setPrefs((prev) => ({ ...prev, email: details.checked }))}
                >
                  <Switch.HiddenInput />
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <Switch.Label>رسائل البريد الإلكتروني</Switch.Label>
                </Switch.Root>

                <Switch.Root
                  checked={prefs.announcements}
                  onCheckedChange={(details) => setPrefs((prev) => ({ ...prev, announcements: details.checked }))}
                >
                  <Switch.HiddenInput />
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <Switch.Label>إعلانات العضوية</Switch.Label>
                </Switch.Root>

                <Switch.Root
                  checked={prefs.community}
                  onCheckedChange={(details) => setPrefs((prev) => ({ ...prev, community: details.checked }))}
                >
                  <Switch.HiddenInput />
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <Switch.Label>تحديثات المجتمع</Switch.Label>
                </Switch.Root>

                <Button
                  variant="outline"
                  borderColor="border"
                  onClick={handleSavePrefs}
                  disabled={savingPrefs}
                  loading={savingPrefs}
                >
                  حفظ الإعدادات
                </Button>
              </Stack>
            )}
          </Stack>
        </PremiumCard>

        <PremiumCard variant="elevated" p={{ base: 6, md: 8 }}>
          <Stack gap={4}>
            <Heading size="md">تغيير البريد الإلكتروني</Heading>
            <Text color="muted">
              سيقوم فريق الدعم بمراجعة طلبك قبل تحديث البريد.
            </Text>
            <Field label="البريد الإلكتروني الجديد" required inputId="new-email">
              <Input
                id="new-email"
                type="email"
                value={emailChangeForm.newEmail}
                onChange={(e) =>
                  setEmailChangeForm((prev) => ({ ...prev, newEmail: e.target.value }))
                }
                placeholder="name@example.com"
              />
            </Field>
            <Field label="ملاحظة (اختياري)" inputId="email-note">
              <Input
                id="email-note"
                value={emailChangeForm.note}
                onChange={(e) => setEmailChangeForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="سبب التغيير أو أي تفاصيل مهمة"
              />
            </Field>
            <Button
              variant="outline"
              borderColor="border"
              onClick={handleEmailChangeRequest}
              disabled={requestingEmailChange}
              loading={requestingEmailChange}
            >
              إرسال طلب التغيير
            </Button>
          </Stack>
        </PremiumCard>

        <PremiumCard variant="bordered" p={{ base: 6, md: 8 }}>
          <Stack gap={3}>
            <Heading size="md">إجراءات الحساب</Heading>
            <Button variant="outline" borderColor="border" onClick={logout}>
              تسجيل الخروج
            </Button>
            <Field label="سبب حذف الحساب (اختياري)" inputId="delete-reason">
              <Input
                id="delete-reason"
                value={deleteForm.reason}
                onChange={(e) => setDeleteForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="مثل: توقف عن الاستخدام"
              />
            </Field>
            <Button
              variant="outline"
              borderColor="error"
              color="error"
              onClick={handleDeleteAccountRequest}
              disabled={requestingDelete}
              loading={requestingDelete}
            >
              إرسال طلب حذف الحساب
            </Button>
            <Text color="muted" fontSize="xs">
              سيتم مراجعة الطلب من فريق الدعم قبل إغلاق الحساب نهائياً.
            </Text>
          </Stack>
        </PremiumCard>
      </Stack>
    </Container>
  );
}
