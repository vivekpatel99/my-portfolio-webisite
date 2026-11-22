import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';
import React from 'react';
import { useLocale } from '@/lib/locale.js';

export function Toaster() {
	const { toasts } = useToast();
	const locale = useLocale();

	return (
		<ToastProvider label={locale === 'de' ? 'Benachrichtigung' : undefined}>
			{toasts.map(({ id, title, description, translations, action, dismiss, ...props }) => {
				const content = translations?.[locale] ?? { title, description };
				return (
					<Toast key={id} {...props}>
						<div className="grid gap-1">
							{content.title && <ToastTitle>{content.title}</ToastTitle>}
							{content.description && (
								<ToastDescription>{content.description}</ToastDescription>
							)}
						</div>
						{action}
						<ToastClose aria-label={locale === 'de' ? 'Benachrichtigung schließen' : 'Dismiss notification'} />
					</Toast>
				);
			})}
			<ToastViewport label={locale === 'de' ? 'Benachrichtigungen ({hotkey})' : undefined} />
		</ToastProvider>
	);
}
