"use client";

import { useState, useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, ShieldCheck, Info, Loader2, Camera, UploadCloud, FileImage, Bot } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { verifyMember, type VerifyMemberOutput } from '@/ai/flows/verify-member-flow';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';

const verificationSchema = z.object({
  fullName: z.string().min(3, { message: 'Full name must be at least 3 characters.' }).max(100, {message: "Name too long."}),
  nationalId: z.string().min(5, { message: 'National ID must be valid.' }).max(30, {message: "ID too long."}),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, { message: 'Enter a valid phone number (e.g., +1234567890).' }),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function VerificationForm() {
  const { toast } = useToast();
  const { currentUser, updateCurrentUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [hashedPii, setHashedPii] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerifyMemberOutput | null>(null);
  
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [livenessPhoto, setLivenessPhoto] = useState<string | null>(null);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraLive, setIsCameraLive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleEnableCamera = async () => {
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(cameraStream);
      setHasCameraPermission(true);
      setIsCameraLive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = cameraStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      setIsCameraLive(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use this feature.',
      });
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleCaptureLiveness = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setLivenessPhoto(dataUrl);
        toast({ title: "Liveness photo captured!" });
      }
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  };

  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { fullName: '', nationalId: '', phoneNumber: '' },
  });

  async function onSubmit(data: VerificationFormData) {
    if (!idFront || !idBack) {
        toast({ title: 'Missing Documents', description: 'Please upload both the front and back of your ID.', variant: 'destructive' });
        return;
    }
    if (!livenessPhoto) {
        toast({ title: 'Missing Liveness Photo', description: 'Please capture a photo for the liveness check.', variant: 'destructive' });
        return;
    }
    
    setIsLoading(true);
    setHashedPii(null);
    setVerificationResult(null);

    try {
      const piiString = `${data.fullName.trim().toLowerCase()}|${data.nationalId.trim()}|${data.phoneNumber.trim()}`;
      const hash = await sha256(piiString);
      setHashedPii(hash);
      
      const [idFrontDataUri, idBackDataUri] = await Promise.all([
          fileToDataUri(idFront),
          fileToDataUri(idBack),
      ]);

      const result = await verifyMember({
          idFrontDataUri,
          idBackDataUri,
          livenessPhotoDataUri: livenessPhoto,
          piiHash: hash,
      });

      setVerificationResult(result);

      if (result.isVerified) {
          toast({
              title: 'Verification Successful!',
              description: result.reasoning,
          });
          if (currentUser) {
              updateCurrentUser({ verificationStatus: 'verified', hashedPii: hash });
          }
      } else {
          toast({
              title: 'Verification Rejected',
              description: result.reasoning,
              variant: 'destructive',
          });
          if (currentUser) {
              updateCurrentUser({ verificationStatus: 'unverified' }); 
          }
      }
    } catch (error) {
      console.error("Verification process error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      setVerificationResult({ isVerified: false, reasoning: `An internal error occurred during verification. ${errorMessage}` });
      toast({
        title: 'Verification Failed',
        description: 'Could not process your verification request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="text-center p-6">
         <div className="inline-flex justify-center items-center p-3 bg-primary/10 rounded-full mb-3 mx-auto w-fit">
            <UserCheck className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="font-headline text-2xl text-foreground">Member Verification (KYC)</CardTitle>
        <CardDescription>Securely verify your identity. Your personal information is processed locally.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <Alert className="bg-accent/20 border-accent text-accent-foreground">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <AlertTitle className="font-semibold text-foreground/90">Privacy First</AlertTitle>
          <AlertDescription className="text-sm">
            Your personal details are hashed on your device. We only store a secure, one-way hash of your information.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-foreground">Step 1: Personal Information</h3>
              <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name (as on ID)</FormLabel>
                    <FormControl><Input placeholder="Enter your full name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="nationalId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>National ID Number</FormLabel>
                    <FormControl><Input placeholder="Enter your National ID" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input type="tel" placeholder="+254700123456" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
            </div>

            <Separator />
            
            <div className="space-y-4">
                <h3 className="font-semibold text-lg text-foreground">Step 2: ID Document Upload</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormItem>
                        <FormLabel htmlFor="id-front">ID Front</FormLabel>
                        <Input id="id-front" type="file" accept="image/*" onChange={(e) => setIdFront(e.target.files?.[0] ?? null)} />
                        {idFront && <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1"><FileImage className="h-3 w-3"/>{idFront.name}</p>}
                    </FormItem>
                    <FormItem>
                        <FormLabel htmlFor="id-back">ID Back</FormLabel>
                        <Input id="id-back" type="file" accept="image/*" onChange={(e) => setIdBack(e.target.files?.[0] ?? null)} />
                        {idBack && <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1"><FileImage className="h-3 w-3"/>{idBack.name}</p>}
                    </FormItem>
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="font-semibold text-lg text-foreground">Step 3: Liveness Check</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="relative rounded-md overflow-hidden border bg-muted aspect-video flex items-center justify-center">
                        <video ref={videoRef} className={cn("w-full h-full object-cover", !isCameraLive && 'hidden')} autoPlay muted playsInline />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        {!isCameraLive && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
                                <Camera className="h-12 w-12 mb-4" />
                                {hasCameraPermission === false ? (
                                    <p className="font-bold text-destructive">Camera Access Denied</p>
                                ) : (
                                    <p className="text-sm">Click "Enable Camera" to start the liveness check.</p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="space-y-4">
                        {!isCameraLive ? (
                            <Button type="button" onClick={handleEnableCamera} className="w-full">
                                <Camera className="mr-2 h-4 w-4" /> Enable Camera
                            </Button>
                        ) : (
                            <Button type="button" onClick={handleCaptureLiveness} className="w-full">
                                <Camera className="mr-2 h-4 w-4" /> Capture Photo
                            </Button>
                        )}
                        {livenessPhoto && (
                            <div className="relative rounded-md overflow-hidden border bg-muted aspect-video flex items-center justify-center">
                                <img src={livenessPhoto} alt="Liveness capture" className="w-full h-full object-cover"/>
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-bold">
                                    Captured!
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <Separator />
            
            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading || verificationResult?.isVerified}>
              {isLoading && <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying with AI...</>}
              {!isLoading && verificationResult?.isVerified && <><ShieldCheck className="mr-2"/> Successfully Verified</>}
              {!isLoading && !verificationResult?.isVerified && 'Submit for AI Verification'}
            </Button>
          </form>
        </Form>
      </CardContent>
      {verificationResult && !isLoading && (
        <CardFooter className="flex-col items-start space-y-2 pt-4 p-6 border-t">
          <Alert variant={verificationResult.isVerified ? 'default' : 'destructive'} className={verificationResult.isVerified ? "border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-500/50" : ""}>
              <Bot className="h-5 w-5" />
              <AlertTitle className="font-semibold">
                  {verificationResult.isVerified ? 'Verification Approved' : 'Verification Rejected'}
              </AlertTitle>
              <AlertDescription className="text-sm">
                  <strong>AI Reasoning:</strong> {verificationResult.reasoning}
              </AlertDescription>
          </Alert>
          {hashedPii && (
            <div className="pt-2 w-full">
              <p className="text-sm font-medium text-foreground">Generated PII Hash (for demo):</p>
              <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto w-full text-muted-foreground">{hashedPii}</pre>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
